#!/usr/bin/env bash
mkdir -p data
java -cp java-app/bin com.taskflow.Main "$@"
