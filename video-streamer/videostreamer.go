package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"sync"
	"syscall"
	"time"
	"unsafe"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// #include "videostreamer.h"
// #include <stdlib.h>
// #cgo LDFLAGS: -lasound -lbz2 -llzma -lxcb -lxcb-shape -lxcb-shm -lxcb-xfixes
// #cgo CFLAGS: -std=c11
import "C"

var (
	probeSize       = flag.Int("probesize", 64000, "ProbeSize passed to ffmpeg.")
	analyzeDuration = flag.Int("analyze_duration", 300000, "Max analyze duration passed to ffmpeg.")
	listenHost      = flag.String("host", "0.0.0.0", "Host to listen on.")
	listenPort      = flag.Int("port", 8080, "Port to listen on.")
	input           = flag.String("input", "", "Input URL valid for the given format. For RTSP you can provide a rtsp:// URL.")
	verbose         = flag.Bool("verbose", false, "Enable verbose logging output.")
	packetChanDepth = flag.Int("packet_chan_depth", 128, "Depth of the packet channel.")
)

var (
	activeClients = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "clients_active",
		Help: "The total number of active clients",
	})
	activeEncoders = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "encoders_active",
		Help: "The total number of active encoders",
	})
	activeEncoderClients = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "encoder_clients_active",
		Help: "The total number of active clients to encoders",
	})
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

type streamData struct {
	ClientChan chan *Client
	input      *Input
	inputWg    sync.WaitGroup
}

// HTTPHandler allows us to pass information to our request handlers.
type HTTPHandler struct {
	Verbose         bool
	Streams         map[streamViewInfo]*streamData
	StreamsMutex    *sync.RWMutex
	ProbeSize       int
	AnalyzeDuration int
}

// Client is servicing one HTTP client.
type Client struct {
	// packetWriter goroutine writes out video packets to this pipe. HTTP
	// goroutine reads from the read side.
	OutPipe *os.File

	// Encoder writes packets to this channel, then the packetWriter goroutine
	// writes them to the pipe.
	PacketChan chan packetData
}

// Input represents a video input.
type Input struct {
	mutex   *sync.RWMutex
	vsInput *C.struct_VSInput
}

type packetData struct {
	pkt      *C.AVPacket
	timeBase C.AVRational
}

func main() {
	flag.Parse()

	C.vs_init()

	// Start serving either with HTTP or FastCGI.

	hostPort := fmt.Sprintf("%s:%d", *listenHost, *listenPort)

	streamHandler := HTTPHandler{
		Verbose:         *verbose,
		Streams:         make(map[streamViewInfo]*streamData),
		StreamsMutex:    &sync.RWMutex{},
		ProbeSize:       *probeSize,
		AnalyzeDuration: *analyzeDuration,
	}

	log.Printf("Starting to serve requests on %s (HTTP)", hostPort)

	http.Handle("/metrics", promhttp.Handler())
	http.Handle("/stream", streamHandler)
	http.Handle("/info", streamHandler)
	err := http.ListenAndServe(hostPort, nil)
	if err != nil {
		log.Fatalf("Unable to serve: %s", err)
	}
}

func (h HTTPHandler) encoder(si streamViewInfo) {
	sd := h.Streams[si]
	activeEncoders.Inc()
	clients := []*Client{}
	clientChan := sd.ClientChan

	log.Printf("encoder: got url %s", si.Url)

	sd.input = openInputRetry(si, h.ProbeSize, h.AnalyzeDuration, 5, h.Verbose)
	sd.inputWg.Done()
	if sd.input == nil {
		log.Printf("encoder: Unable to open input")
		h.cleanupEncoder(si, clients, sd.input)
		return
	}

	if h.Verbose {
		log.Printf("encoder: Opened input")
	}

	log.Printf("encoder: Waiting for clients...")
	client := <-clientChan
	activeEncoderClients.Inc()
	log.Printf("encoder: New client")
	clients = append(clients, client)

	for {
		// Get any new clients, but don't block.
		clients = acceptClients(clientChan, clients)

		// Read a packet.
		var pkt C.AVPacket
		readRes := C.int(0)
		// We might want to lock input here. It's probably not necessary though.
		// Other goroutines should only be reading it. We're the writer.
		readRes = C.vs_read_packet(sd.input.vsInput, &pkt, C.bool(h.Verbose))
		if readRes == -1 {
			log.Printf("encoder: Failure reading packet")
			h.cleanupEncoder(si, clients, sd.input)
			return
		}

		if readRes == 0 {
			continue
		}

		if pkt.stream_index == sd.input.vsInput.vstream_idx && sd.input.vsInput.venc_ctx != nil ||
			pkt.stream_index == sd.input.vsInput.astream_idx && sd.input.vsInput.aenc_ctx != nil {
			if C.vs_filter_packet(sd.input.vsInput, &pkt, C.bool(h.Verbose)) != 0 {
				log.Printf("could not filter packet")
			}
			C.av_packet_unref(&pkt)

			for C.vs_get_filtered_packet(sd.input.vsInput, &pkt, C.bool(h.Verbose)) > 0 {
				// Write the packet to all clients.
				clients = writePacketToClients(sd.input, &pkt, clients, h.Verbose)
				C.av_packet_unref(&pkt)
			}
		} else {
			clients = writePacketToClients(sd.input, &pkt, clients, h.Verbose)
			C.av_packet_unref(&pkt)
		}

		// If we get down to zero clients, close the input.
		if len(clients) == 0 {
			log.Printf("No clients left")
			h.cleanupEncoder(si, clients, sd.input)
			return
		}
	}
}

func (h HTTPHandler) cleanupEncoder(si streamViewInfo, clients []*Client, input *Input) {
	h.StreamsMutex.Lock()
	cleanupClients(clients)
	if input != nil {
		destroyInput(input)
	}
	delete(h.Streams, si)
	h.StreamsMutex.Unlock()
	log.Printf("cleaned up encoder")
	activeEncoders.Dec()
}

func acceptClients(clientChan <-chan *Client, clients []*Client) []*Client {
	for {
		select {
		case client := <-clientChan:
			log.Printf("got a new client")
			activeEncoderClients.Inc()
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
	// Closing write side will make read side receive EOF.
	if client.OutPipe != nil {
		_ = client.OutPipe.Close()
		client.OutPipe = nil
	}

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
			C.av_packet_free(&pkt.pkt)
		}

		client.PacketChan = nil
	}

	activeEncoderClients.Dec()
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

	if C.vs_input_audio_encoder_open(input, C.bool(verbose)) != 0 {
		log.Printf("Unable to open audio encoder")
		destroyInput(i)
		return nil
	}

	if !si.Transcode {
		return i
	}

	if C.vs_input_video_encoder_open(
		input,
		C.bool(si.Crop), C.int(si.PosX), C.int(si.PosY), C.int(si.Width), C.int(si.Height),
		C.bool(si.Scale), C.int(si.OutWidth), C.int(si.OutHeight),
		C.bool(verbose)) != 0 {
		log.Printf("Unable to open video encoder")
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
func writePacketToClients(input *Input, pkt *C.AVPacket, clients []*Client, verbose bool) []*Client {
	// Rewrite clients slice with only those we succeeded in writing to. If we
	// failed for some reason we clean up the client and no longer send it
	// anything further.
	clients2 := []*Client{}

	var timeBase C.AVRational
	if C.vs_packet_timebase(input.vsInput, pkt, &timeBase) != 0 {
		log.Printf("Unable to get timebase for pkt")
		return clients2
	}

	for _, client := range clients {
		// Duplicate the packet. Each client's goroutine will receive a copy.
		pktCopy := C.av_packet_clone(pkt)
		if pktCopy == nil {
			log.Printf("Unable to clone packet")
			cleanupClient(client)
			continue
		}

		// Pass the packet to a goroutine that writes it to this client.
		pktData := packetData{
			pkt:      pktCopy,
			timeBase: timeBase,
		}

		select {
		case client.PacketChan <- pktData:
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

// Open the output file. This creates an MP4 container and writes the header to
// the given output URL.
func openOutput(outputURL string, verbose bool, input *Input) *C.struct_VSOutput {
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
	if ok := q["url"]; ok == nil {
		log.Printf("Url parameter not found")
		return streamViewInfo{}, errors.New("Url parameter not found")
	}

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
		h.streamRequest(rw, r)
		return
	} else if r.Method == "GET" && r.URL.Path == "/info" {
		h.infoRequest(rw, r)
		return
	}

	log.Printf("Unknown request.")
	http.Error(rw, "Not found", http.StatusNotFound)
}

func (h HTTPHandler) streamRequest(rw http.ResponseWriter, r *http.Request) {
	si, err := parseStreamUrl(*r.URL)
	if err != nil {
		log.Printf("Unable to parse URL parameters: %s", r.URL)
		http.Error(rw, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("Stream URL: %s", si.Url)
	h.StreamsMutex.Lock()
	if ok := h.Streams[si]; ok == nil {
		// This is a new stream. We create a new client channel and start
		// an encoder for it.
		sd := streamData{ClientChan: make(chan *Client)}
		sd.inputWg.Add(1)
		h.Streams[si] = &sd
		go h.encoder(si)
	}
	h.StreamsMutex.Unlock()

	h.streamData(rw, r, h.Streams[si])
}

// Read from a pipe where streaming media shows up. We read a chunk and write it
// immediately to the client, and repeat forever (until either the client goes
// away, or an error of some kind occurs).
func (h HTTPHandler) streamData(rw http.ResponseWriter, r *http.Request, sd *streamData) {
	activeClients.Inc()
	defer activeClients.Dec()
	// Wait for Input to be opened first.
	sd.inputWg.Wait()
	if sd.input == nil {
		log.Printf("Failed to open input")
		http.Error(rw, "Failed to open input", http.StatusInternalServerError)
		return
	}

	// The encoder writes to the out pipe (using the packetWriter goroutine). We
	// read from the in pipe.
	inPipe, outPipe, err := os.Pipe()
	if err != nil {
		log.Printf("Unable to open pipe: %s", err)
		http.Error(rw, err.Error(), http.StatusInternalServerError)
		return
	}

	// Make the inPipe non-blocking.
	inFile, err := makeNonBlockingFile(inPipe)
	if err != nil {
		log.Printf("Unable to make file non-blocking: %s", err)
		http.Error(rw, err.Error(), http.StatusInternalServerError)
		return
	}

	packetChan := make(chan packetData, *packetChanDepth)

	c := &Client{
		OutPipe:    outPipe,
		PacketChan: packetChan,
	}

	outputURL := fmt.Sprintf("pipe:%d", c.OutPipe.Fd())
	output := openOutput(outputURL, h.Verbose, sd.input)
	if output == nil {
		log.Print("Unable to open output for client")
		http.Error(rw, "Unable to open output for client", http.StatusInternalServerError)
		return
	}

	log.Printf("Opened output for client")

	rw.Header().Set("Content-Type", "video/mp4")
	rw.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

	// Tell the encoder we're here.
	// TODO: There is a potential race condition here when the encoder exists,
	// but we are still waiting for it here.
	sd.ClientChan <- c

	for {
		select {
		case pkt := <-packetChan:
			err := h.writePacketToClient(rw, r, output, inFile, pkt)
			if err != nil {
				log.Printf("Could not write packet to client: %s", err)
				goto Exit
			}
		case <-time.After(10 * time.Second):
			log.Printf("Client timed out after waiting for 10s for next packet")
			goto Exit
		}
	}
Exit:

	// Writes to write side will raise error when read side is closed.
	_ = inPipe.Close()

	C.vs_destroy_output(output)

	log.Printf("%s: Client cleaned up", r.RemoteAddr)
}

func (h HTTPHandler) writePacketToClient(rw http.ResponseWriter, r *http.Request, output *C.struct_VSOutput, inFile int, pkt packetData) error {
	writeRes := C.int(0)
	writeRes = C.vs_write_packet(output, pkt.pkt, pkt.timeBase, C.bool(h.Verbose))
	C.av_packet_free(&pkt.pkt)
	if writeRes == -1 {
		return fmt.Errorf("Failure writing packet")
	}

	// Send chunked data.
	buf := make([]byte, 1024)

	for {
		readSize, err := syscall.Read(inFile, buf)
		if os.IsTimeout(err) {
			break
		}

		if err != nil {
			return fmt.Errorf("%s: Read error: %s", r.RemoteAddr, err)
		}

		// We get EOF if write side of pipe closed.
		if readSize == 0 {
			if err == io.EOF {
				return fmt.Errorf("%s: EOF", r.RemoteAddr)
			} else {
				break
			}
		}

		writeSize, err := rw.Write(buf[:readSize])
		if err != nil {
			return fmt.Errorf("%s: Write error: %s", r.RemoteAddr, err)
		}

		if writeSize != readSize {
			return fmt.Errorf("%s: Short write", r.RemoteAddr)
		}

		// ResponseWriter buffers chunks. Flush them out ASAP to reduce the time a
		// client is waiting, especially initially.
		if flusher, ok := rw.(http.Flusher); ok {
			flusher.Flush()
		}
	}

	return nil
}

func (h HTTPHandler) infoRequest(rw http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if ok := q["url"]; ok == nil {
		log.Printf("Url parameter not found")
		http.Error(rw, "Url parameter not found", http.StatusBadRequest)
		return
	}

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

func makeNonBlockingFile(in *os.File) (int, error) {
	fd := in.Fd()
	fdi := int(fd)
	syscall.SetNonblock(fdi, true)
	// Make pipe size larger as otherwise there might not be enough room to store
	// full video frames.
	syscall.Syscall(syscall.SYS_FCNTL, fd, syscall.F_SETPIPE_SZ, 4096*64)
	return fdi, nil
}
