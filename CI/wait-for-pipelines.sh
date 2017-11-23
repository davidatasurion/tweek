#!/bin/sh

GIT_SHA=$1
EXPECTED_IMAGES_AMOUNT=$2
SLEEP_INTERVAL=${3-5}
MAX_RETRIES=${4-100}

for i in $(seq $MAX_RETRIES)
do
  echo Performing try [ $i/$MAX_RETRIES ] to get all ready images that matches git sha: $GIT_SHA
  RESULT=$(cf-cli images ls --list -s $GIT_SHA | wc -l)
  if [ "$RESULT" -ge "$EXPECTED_IMAGES_AMOUNT" ];
  then
    echo Total ready images: [ $RESULT/$EXPECTED_IMAGES_AMOUNT ]
    echo Success: All images are ready
    echo ""
    exit 0
  else
    echo Total ready images: [ $RESULT/$EXPECTED_IMAGES_AMOUNT ]
    echo "Waiting $SLEEP_INTERVAL seconds before retrying again"
    echo ""
    sleep $SLEEP_INTERVAL
  fi
done

echo Failure: Reached max retries
exit 1