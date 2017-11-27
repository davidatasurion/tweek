#!/bin/sh

GIT_SHA=$1
SLEEP_INTERVAL=${2-5}
MAX_RETRIES=${3-100}

for i in $(seq $MAX_RETRIES)
do
  echo Performing try [ $i/$MAX_RETRIES ] to get all ready images that matches git sha: $GIT_SHA

  cf-cli images ls --list -s $GIT_SHA > images.txt

  if [ $(grep -c "soluto/tweek-api " images.txt) -gt 0 ] && [ $(grep -c "soluto/tweek-management " images.txt) -gt 0 ] && [ $(grep -c "soluto/tweek-authoring " images.txt) -gt 0 ] && [ $(grep -c "soluto/tweek-editor " images.txt) -gt 0 ]
  then
    echo Success: All images are ready
    echo ""
    exit 0
  else  
    echo "Waiting $SLEEP_INTERVAL seconds before retrying again"
    echo ""
    sleep $SLEEP_INTERVAL
  fi
done

echo Failure: Reached max retries
exit 1