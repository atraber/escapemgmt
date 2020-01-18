// Copyright 2017 The Prometheus Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-kit/kit/log"
	"github.com/go-kit/kit/log/level"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/procfs"
	kingpin "gopkg.in/alecthomas/kingpin.v2"
)

var (
	// The path of the proc filesystem.
	procPath = kingpin.Flag("path.procfs", "procfs mountpoint.").Default(procfs.DefaultMountPoint).String()
)

func procFilePath(name string) string {
	return filepath.Join(*procPath, name)
}

type arpCollector struct {
	entries *prometheus.Desc
	logger  log.Logger
}

type arpEntry struct {
	device string
	ipAddr string
}

// NewARPCollector returns a new Collector exposing ARP stats.
func NewARPCollector(logger log.Logger) (prometheus.Collector, error) {
	return &arpCollector{
		entries: prometheus.NewDesc(
			prometheus.BuildFQName("node", "arp", "entries"),
			"ARP entries by device",
			[]string{"device", "ipaddr", "hwaddr"}, nil,
		),
		logger: logger,
	}, nil
}

func getARPEntries() (map[arpEntry]string, error) {
	file, err := os.Open(procFilePath("net/arp"))
	if err != nil {
		return nil, err
	}
	defer file.Close()

	entries, err := parseARPEntries(file)
	if err != nil {
		return nil, err
	}

	return entries, nil
}

func parseARPEntries(data io.Reader) (map[arpEntry]string, error) {
	scanner := bufio.NewScanner(data)
	entries := make(map[arpEntry]string)

	for scanner.Scan() {
		columns := strings.Fields(scanner.Text())

		if len(columns) < 6 {
			return nil, fmt.Errorf("unexpected ARP table format")
		}

		if columns[0] != "IP" && columns[2] == "0x2" {
			entry := arpEntry{
				device: columns[len(columns)-1],
				ipAddr: columns[0],
			}
			entries[entry] = columns[3]
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("failed to parse ARP info: %s", err)
	}

	return entries, nil
}

func (c *arpCollector) Collect(ch chan<- prometheus.Metric) {
	entries, err := getARPEntries()
	if err != nil {
		level.Error(c.logger).Log("msg", "could not get ARP entries:", "err", err)
		return
	}

	now := time.Now().Unix()
	for entry, hwAddr := range entries {
		ch <- prometheus.MustNewConstMetric(
			c.entries, prometheus.GaugeValue, float64(now), entry.device, entry.ipAddr, hwAddr)
	}
}

func (c *arpCollector) Describe(ch chan<- *prometheus.Desc) {
	ch <- c.entries
}
