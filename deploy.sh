#!/bin/bash
set -ex

rm -rf dist
npm run build
mv dist/teleinfo-ui-ng dist/build
tar -zcvf build.tgz  --directory dist/ .
scp  build.tgz pi@192.168.1.38:/home/pi/teleinfo

echo "########## load on server ###########"

ssh pi@192.168.1.38 "\
 sudo systemctl stop teleinfo_ui.service      &&\
 cd /home/pi/teleinfo  && tar -zxvf build.tgz &&\
 sudo systemctl start teleinfo_ui.service      "

echo "########## restart viewer ###########"
ssh pi@192.168.1.34 "bash refresh.sh"
