#!/bin/bash
sudo docker tag escape_streamer:latest escape_streamer:2019-03-10
sudo docker tag escape_streamer:2019-03-10 192.168.0.150:5000/escape_streamer:2019-03-10
sudo docker push 192.168.0.150:5000/escape_streamer:2019-03-10
