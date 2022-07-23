#!/bin/bash -xe
## Copyright Amazon.com Inc. or its affiliates.
HOMEDIR=/home/ec2-user
cd /tmp
yum -y install make gcc gcc-c++ make subversion libxml2-devel ncurses-devel openssl-devel vim-enhanced man glibc-devel autoconf libnewt kernel-devel kernel-headers linux-headers openssl-devel zlib-devel libsrtp libsrtp-devel uuid libuuid-devel mariadb-server jansson-devel libsqlite3x libsqlite3x-devel epel-release.noarch bash-completion bash-completion-extras unixODBC unixODBC-devel libtool-ltdl libtool-ltdl-devel mysql-connector-odbc mlocate libiodbc sqlite sqlite-devel sql-devel.i686 sqlite-doc.noarch sqlite-tcl.x86_64 patch libedit-devel jq
wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-18-current.tar.gz
tar xvzf asterisk-18-current.tar.gz 
cd asterisk-18*/
./configure --libdir=/usr/lib64 --with-jansson-bundled
make menuselect.makeopts
menuselect/menuselect \
        --disable BUILD_NATIVE \
        --disable chan_sip \
        --disable chan_skinny \
        --enable cdr_csv \
        --enable res_snmp \
        --enable res_http_websocket \
        menuselect.makeopts
make 
make install
make basic-pbx
touch /etc/redhat-release
make config
ldconfig
