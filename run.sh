#!/bin/bash
echo "REACT_APP_BASEURL=$REACT_APP_BASEURL" > .env
npm run build
npm run start-backend &
serve -s build &
wait