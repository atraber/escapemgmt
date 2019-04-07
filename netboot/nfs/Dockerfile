FROM alpine:3.9.2

EXPOSE 111/udp 111/tcp 2049/udp 2049/tcp
VOLUME /data/

RUN set -xe \
    && apk add --no-cache nfs-utils \
    && mkdir -p /var/lib/nfs/rpc_pipefs \
    && mkdir -p /var/lib/nfs/v4recovery \
    && echo "rpc_pipefs /var/lib/nfs/rpc_pipefs rpc_pipefs defaults 0 0" >> /etc/fstab \
    && echo "nfsd       /proc/fs/nfsd           nfsd       defaults 0 0" >> /etc/fstab

RUN echo "/data *(ro,fsid=0,async,no_subtree_check,no_auth_nlm,insecure,no_root_squash)" \
    > /etc/exports

COPY ./nfsd.sh /usr/bin/nfsd.sh
RUN chmod +x /usr/bin/nfsd.sh

ENTRYPOINT ["sh", "/usr/bin/nfsd.sh"]
