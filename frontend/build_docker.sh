#!/bin/bash
./node_modules/@angular/cli/bin/ng build --env=docker --prod
sudo docker image build -t escape_frontend .
