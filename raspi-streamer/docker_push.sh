#!/bin/bash
tag=2019-03-24
sudo docker tag escape_streamer:latest escape_streamer:$tag
sudo docker tag escape_streamer:$tag 192.168.0.150:5000/escape_streamer:$tag
sudo docker push 192.168.0.150:5000/escape_streamer:$tag
