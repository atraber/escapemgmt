#!/bin/bash
helm install --name escape-mariadb -f helm-mariadb-values.yml stable/mariadb
