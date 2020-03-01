package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"sync"
	"unsafe"
)

// #include "videostreamer.h"
// #include <stdlib.h>
// #cgo LDFLAGS: -lswscale -lavformat -lavdevice -lavcodec -lavutil -lswscale
// #cgo CFLAGS: -std=c11
// #cgo pkg-config: libavcodec
import "C"

var (
	probeSize       = flag.Int("probesize", 32000, "ProbeSize passed to ffmpeg.")
	analyzeDuration = flag.Int("analyze_duration", 20000, "Max analyze duration passed to ffmpeg.")
	listenHost      = flag.String("host", "0.0.0.0", "Host to listen on.")
	listenPort      = flag.Int("port", 8080, "Port to listen on.")
	input           = flag.String("input", "", "Input URL valid for the given format. For RTSP you can provide a rtsp:// URL.")
	verbose         = flag.Bool("verbose", false, "Enable verbose logging output.")
)

type streamInfo struct {
	Width  int
	Height int
}

type streamViewInfo struct {
	Url       string
	Transcode bool
	Crop      bool
	PosX      int
	PosY      int
	Width     int
	Height    int
	Scale     bool
	OutWidth  int
	OutHeight int
}

// HTTPHandler allows us to pass information to our request handlers.
type HTTPHandler struct {
	Verbose         bool
	ClientChan      map[streamViewInfo]chan *Client
	ClientChanMutex *sync.RWMutex
	ProbeSize       int
	AnalyzeDuration int
}

// Client is servicing one HTTP client.
type Client struct {
	// Protect access to Output in particular. Destroying it when we clean up
	// the client can race with packetWriter().
	mutex *sync.RWMutex

	// packetWriter goroutine writes out video packets to this pipe. HTTP
	// goroutine reads from the read side.
	OutPipe *os.File

	// Reference to a media output context. Through this, the packetWriter
	// goroutine writes packets to the write side of the pipe.
	Output *C.struct_VSOutput

	// Encoder writes packets to this channel, then the packetWriter goroutine
	// writes them to the pipe.
	PacketChan chan *C.AVPacket
}

// Input represents a video input.
type Input struct {
	mutex   *sync.RWMutex
	vsInput *C.struct_VSInput
}

func main() {
	flag.Parse()

	C.vs_init()

	// Start serving either with HTTP or FastCGI.

	hostPort := fmt.Sprintf("%s:%d", *listenHost, *listenPort)

	handler := HTTPHandler{
		Verbose:         *verbose,
		ClientChan:      make(map[streamViewInfo]chan *Client),
		ClientChanMutex: &sync.RWMutex{},
		ProbeSize:       *probeSize,
		AnalyzeDuration: *analyzeDuration,
	}

	s := &http.Server{
		Addr:    hostPort,
		Handler: handler,
	}

	log.Printf("Starting to serve requests on %s (HTTP)", hostPort)

	err := s.ListenAndServe()
	if err != nil {
		log.Fatalf("Unable to serve: %s", err)
	}
}

func (h HTTPHandler) encoder(si streamViewInfo) {
	clients := []*Client{}
	var input *Input

	log.Printf("encoder: got url %s", si.Url)

	for {
		// If there are no clients, then block waiting for one.
		if len(clients) == 0 {
			log.Printf("encoder: Waiting for clients...")
			client := <-h.ClientChan[si]
			log.Printf("encoder: New client")
			clients = append(clients, client)
			continue
		}

		// There is at least one client.

		// Get any new clients, but don't block.
		clients = acceptClients(h.ClientChan[si], clients)

		// Open the input if it is not open yet.
		if input == nil {
			input = openInputRetry(si, h.ProbeSize, h.AnalyzeDuration, 5, h.Verbose)
			if input == nil {
				log.Printf("encoder: Unable to open input")
				h.cleanupEncoder(si, clients, input)
				log.Printf("encoder: giving up")
				return
			}

			if h.Verbose {
				log.Printf("encoder: Opened input")
			}
		}

		// Read a packet.
		var pkt C.AVPacket
		readRes := C.int(0)
		// We might want to lock input here. It's probably not necessary though.
		// Other goroutines should only be reading it. We're the writer.
		readRes = C.vs_read_packet(input.vsInput, &pkt, C.bool(h.Verbose))
		if readRes == -1 {
			log.Printf("encoder: Failure reading packet")
			h.cleanupEncoder(si, clients, input)
			log.Printf("encoder: giving up")
			return
		}

		if readRes == 0 {
			continue
		}

		if si.Transcode {
			if C.vs_filter_packet(input.vsInput, &pkt, C.bool(h.Verbose)) != 0 {
				log.Printf("could not filter packet")
			}
			C.av_packet_unref(&pkt)

			for C.vs_get_filtered_packet(input.vsInput, &pkt, C.bool(h.Verbose)) > 0 {
				// Write the packet to all clients.
				clients = writePacketToClients(input, &pkt, clients, h.Verbose)
				C.av_packet_unref(&pkt)
			}
		} else {
			clients = writePacketToClients(input, &pkt, clients, h.Verbose)
			C.av_packet_unref(&pkt)
		}

		// If we get down to zero clients, close the input.
		if len(clients) == 0 {
			log.Printf("No clients left")
			h.cleanupEncoder(si, clients, input)
			log.Printf("encoder: giving up")
			return
		}
	}
}

func (h HTTPHandler) cleanupEncoder(si streamViewInfo, clients []*Client, input *Input) {
	h.ClientChanMutex.Lock()
	if input != nil {
		destroyInput(input)
	}
	cleanupClients(clients)
	delete(h.ClientChan, si)
	h.ClientChanMutex.Unlock()
}

func acceptClients(clientChan <-chan *Client, clients []*Client) []*Client {
	for {
		select {
		case client := <-clientChan:
			log.Printf("got a new client")
			clients = append(clients, client)
		default:
			return clients
		}
	}
}

func cleanupClients(clients []*Client) {
	for _, client := range clients {
		cleanupClient(client)
	}
}

func cleanupClient(client *Client) {
	client.mutex.Lock()

	// Closing write side will make read side receive EOF.
	if client.OutPipe != nil {
		_ = client.OutPipe.Close()
		client.OutPipe = nil
	}

	if client.Output != nil {
		C.vs_destroy_output(client.Output)
		client.Output = nil
	}

	client.mutex.Unlock()

	if client.PacketChan != nil {
		close(client.PacketChan)

		// Drain it. The packetWriter should be draining it too. However it is
		// possible that it ended.
		//
		// Note one may think that draining both here and in the packetWriter could
		// lead to the unfortunate likelihood that the client will receive some
		// packets but not others, leading to corruption. But since we closed the
		// write side of the pipe above, this will not happen. No further packets
		// will be reaching the client.
		for pkt := range client.PacketChan {
			C.av_packet_free(&pkt)
		}

		client.PacketChan = nil
	}
}

func openInputRetry(si streamViewInfo, probeSize int, analyzeDuration int, tries int, verbose bool) *Input {
	var input *Input
	linearTries := (tries + 1) / 2
	expTries := tries - linearTries
	ps := probeSize
	ad := analyzeDuration
	for i := 0; i < linearTries; i++ {
		input = openInput(si, ps, ad, verbose)
		if input != nil {
			return input
		}
		ps += probeSize * 2
		ad += analyzeDuration * 2
	}

	for i := 0; i < expTries; i++ {
		ps *= 2
		ad *= 2
		input = openInput(si, ps, ad, verbose)
		if input != nil {
			return input
		}
	}

	return nil
}

func openInput(si streamViewInfo, probeSize int, analyzeDuration int, verbose bool) *Input {
	inputFormatC := C.CString("rtsp")
	inputURLC := C.CString(si.Url)

	input := C.vs_input_open(inputFormatC, inputURLC, C.int(probeSize), C.int(analyzeDuration), C.bool(verbose))
	C.free(unsafe.Pointer(inputFormatC))
	C.free(unsafe.Pointer(inputURLC))
	if input == nil {
		log.Printf("Unable to open input")
		return nil
	}
	log.Printf("Input opened")

	i := &Input{
		mutex:   &sync.RWMutex{},
		vsInput: input,
	}

	if !si.Transcode {
		return i
	}

	if C.vs_input_encoder_open(
		input,
		C.bool(si.Crop), C.int(si.PosX), C.int(si.PosY), C.int(si.Width), C.int(si.Height),
		C.bool(si.Scale), C.int(si.OutWidth), C.int(si.OutHeight),
		C.bool(verbose)) != 0 {
		log.Printf("Unable to open encoder")
		destroyInput(i)
		return nil
	}

	return i
}

func getInfoRetry(url string, probeSize int, analyzeDuration int, tries int, verbose bool) (streamInfo, error) {
	input := openInputRetry(streamViewInfo{Url: url}, probeSize, analyzeDuration, tries, verbose)
	if input == nil {
		return streamInfo{}, errors.New("Unable to open input")
	}

	info := C.vs_stream_info(input.vsInput)

	destroyInput(input)

	if info == nil {
		return streamInfo{}, errors.New("Unable to get info from input")
	}

	return streamInfo{Width: int(info.width), Height: int(info.height)}, nil
}

func destroyInput(input *Input) {
	input.mutex.Lock()
	defer input.mutex.Unlock()

	if input.vsInput != nil {
		C.vs_input_free(input.vsInput)
		input.vsInput = nil
	}
}

// Try to write the packet to each client. If we fail, we clean up the client
// and it will not be in the returned list of clients.
func writePacketToClients(input *Input, pkt *C.AVPacket,
	clients []*Client, verbose bool) []*Client {
	// Rewrite clients slice with only those we succeeded in writing to. If we
	// failed for some reason we clean up the client and no longer send it
	// anything further.
	clients2 := []*Client{}

	for _, client := range clients {
		// Open the client's output if it is not yet open.
		client.mutex.Lock()
		if client.Output == nil {
			outputFormat := "mp4"
			outputURL := fmt.Sprintf("pipe:%d", client.OutPipe.Fd())
			client.Output = openOutput(outputFormat, outputURL, verbose, input)
			if client.Output == nil {
				log.Printf("Unable to open output for client")
				cleanupClient(client)
				client.mutex.Unlock()
				continue
			}

			// We pass packets to the client via this channel. We give each client
			// its own goroutine for the purposes of receiving these packets and
			// writing them to the write side of the pipe. We do it this way rather
			// than directly here because we do not want the encoder to block waiting
			// on a write to the write side of the pipe because there is a slow HTTP
			// client.
			client.PacketChan = make(chan *C.AVPacket, 32)

			go packetWriter(client, input, verbose)

			log.Printf("Opened output for client")
		}
		client.mutex.Unlock()

		// Duplicate the packet. Each client's goroutine will receive a copy.
		pktCopy := C.av_packet_clone(pkt)
		if pktCopy == nil {
			log.Printf("Unable to clone packet")
			cleanupClient(client)
			continue
		}

		// Pass the packet to a goroutine that writes it to this client.
		select {
		case client.PacketChan <- pktCopy:
		default:
			log.Printf("Client too slow")
			C.av_packet_free(&pktCopy)
			cleanupClient(client)
			continue
		}

		// Successful so far. Keep the client around.
		clients2 = append(clients2, client)
	}

	return clients2
}

// Receive packets from the encoder, and write them out to the client's pipe.
//
// We end when encoder closes the channel, or if we encounter a write error.
func packetWriter(client *Client, input *Input, verbose bool) {
	for pkt := range client.PacketChan {
		writeRes := C.int(0)
		client.mutex.RLock()
		input.mutex.RLock()
		writeRes = C.vs_write_packet(input.vsInput, client.Output, pkt, C.bool(verbose))
		input.mutex.RUnlock()
		client.mutex.RUnlock()
		C.av_packet_free(&pkt)
		if writeRes == -1 {
			log.Printf("Failure writing packet")
			return
		}
	}
}

// Open the output file. This creates an MP4 container and writes the header to
// the given output URL.
func openOutput(outputFormat, outputURL string, verbose bool, input *Input) *C.struct_VSOutput {
	outputFormatC := C.CString("mp4")
	outputURLC := C.CString(outputURL)

	input.mutex.RLock()
	output := C.vs_open_output(outputFormatC, outputURLC, input.vsInput, C.bool(verbose))
	input.mutex.RUnlock()
	C.free(unsafe.Pointer(outputFormatC))
	C.free(unsafe.Pointer(outputURLC))
	if output == nil {
		log.Printf("Unable to open output")
		return nil
	}

	return output
}

func parseStreamUrl(u url.URL) (streamViewInfo, error) {
	q := u.Query()
	streamUrl, err := url.QueryUnescape(q["url"][0])
	if err != nil {
		return streamViewInfo{}, errors.New("unable to query unescape URL")
	}
	si := streamViewInfo{
		Url:       streamUrl,
		Transcode: false,
	}
	if len(q["x"]) > 0 {
		si.PosX, err = strconv.Atoi(q["x"][0])
		if err != nil {
			return si, err
		}
	}
	if len(q["y"]) > 0 {
		si.PosY, err = strconv.Atoi(q["y"][0])
		if err != nil {
			return si, err
		}
	}
	if len(q["width"]) > 0 {
		si.Width, err = strconv.Atoi(q["width"][0])
		if err != nil {
			return si, err
		}
	}
	if len(q["height"]) > 0 {
		si.Height, err = strconv.Atoi(q["height"][0])
		if err != nil {
			return si, err
		}
	}
	if len(q["out_width"]) > 0 {
		si.OutWidth, err = strconv.Atoi(q["out_width"][0])
		if err != nil {
			return si, err
		}
	}
	if len(q["out_height"]) > 0 {
		si.OutHeight, err = strconv.Atoi(q["out_height"][0])
		if err != nil {
			return si, err
		}
	}
	si.Crop = si.Width > 0 && si.Height > 0
	si.Scale = si.OutWidth > 0 && si.OutHeight > 0
	// Only transcode if we are cropping or  scaling. This would be a waste of
	// CPU resources otherwise.
	si.Transcode = si.Crop || si.Scale

	return si, nil
}

// ServeHTTP handles an HTTP request.
func (h HTTPHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	log.Printf("Serving [%s] request from [%s] to path [%s] (%d bytes)",
		r.Method, r.RemoteAddr, r.URL.Path, r.ContentLength)

	rw.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method == "GET" && r.URL.Path == "/stream" {
		si, err := parseStreamUrl(*r.URL)
		if err != nil {
			log.Printf("Unable to parse URL parameters: %s", r.URL)
			return
		}
		log.Printf("Stream URL: %s", si.Url)
		h.ClientChanMutex.Lock()
		if ok := h.ClientChan[si]; ok == nil {
			// This is a new stream. We create a new client channel and start
			// an encoder for it.
			h.ClientChan[si] = make(chan *Client)
			go h.encoder(si)
		}
		h.ClientChanMutex.Unlock()

		h.streamRequest(rw, r, h.ClientChan[si])
		return
	} else if r.Method == "GET" && r.URL.Path == "/info" {
		h.infoRequest(rw, r)
		return
	}

	log.Printf("Unknown request.")
	rw.WriteHeader(http.StatusNotFound)
	_, _ = rw.Write([]byte("<h1>404 Not found</h1>"))
}

// Read from a pipe where streaming media shows up. We read a chunk and write it
// immediately to the client, and repeat forever (until either the client goes
// away, or an error of some kind occurs).
func (h HTTPHandler) streamRequest(rw http.ResponseWriter, r *http.Request, clientChan chan<- *Client) {
	// The encoder writes to the out pipe (using the packetWriter goroutine). We
	// read from the in pipe.
	inPipe, outPipe, err := os.Pipe()
	if err != nil {
		log.Printf("Unable to open pipe: %s", err)
		rw.WriteHeader(http.StatusInternalServerError)
		_, _ = rw.Write([]byte("<h1>500 Internal server error</h1>"))
		return
	}

	c := &Client{
		mutex:   &sync.RWMutex{},
		OutPipe: outPipe,
	}

	// Tell the encoder we're here.
	clientChan <- c

	rw.Header().Set("Content-Type", "video/mp4")
	rw.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

	// We send chunked by default

	for {
		buf := make([]byte, 1024)
		readSize, err := inPipe.Read(buf)
		if err != nil {
			log.Printf("%s: Read error: %s", r.RemoteAddr, err)
			break
		}

		// We get EOF if write side of pipe closed.
		if readSize == 0 {
			log.Printf("%s: EOF", r.RemoteAddr)
			break
		}

		writeSize, err := rw.Write(buf[:readSize])
		if err != nil {
			log.Printf("%s: Write error: %s", r.RemoteAddr, err)
			break
		}

		if writeSize != readSize {
			log.Printf("%s: Short write", r.RemoteAddr)
			break
		}

		// ResponseWriter buffers chunks. Flush them out ASAP to reduce the time a
		// client is waiting, especially initially.
		if flusher, ok := rw.(http.Flusher); ok {
			flusher.Flush()
		}
	}

	// Writes to write side will raise error when read side is closed.
	_ = inPipe.Close()

	log.Printf("%s: Client cleaned up", r.RemoteAddr)
}

func (h HTTPHandler) infoRequest(rw http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	streamUrl, err := url.QueryUnescape(q["url"][0])
	if err != nil {
		log.Printf("Unable to parse URL parameters: %s", r.URL)
		http.Error(rw, err.Error(), http.StatusInternalServerError)
		return
	}

	si, err := getInfoRetry(streamUrl, h.ProbeSize, h.AnalyzeDuration, 8, h.Verbose)
	if err != nil {
		log.Printf("Failed to get information for %s", streamUrl)
		http.Error(rw, err.Error(), http.StatusInternalServerError)
		return
	}

	js, err := json.Marshal(si)
	if err != nil {
		log.Printf("Failed to marshal json from StreamInfo")
		http.Error(rw, err.Error(), http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.Write(js)
}
