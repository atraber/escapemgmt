#!/usr/bin/python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import re
import ipaddress
from absl import app
from absl import flags

from pool import Pool
from receiver import Receiver
from sender import Sender
import packet


FLAGS = flags.FLAGS

flags.DEFINE_string(
        'interface', default='wlp2s0',
        help='Interface for receiving DHCP packets.')

flags.DEFINE_string(
        'responsible_mac_regex', default='B8:27:EB.*',
        help='Regex for MAC addresses this server is responsible for.')



def isResponsible(mac, responsible_mac_regex):
    return responsible_mac_regex.match(mac) is not None


def createCommon(packet_received: packet.Packet, pool: Pool) -> packet.Packet:
    p = packet.Packet()

    p.message_type = 2
    p.hardware_type = 1
    p.hardware_address_length = 6
    p.hops = 0  # client sets to zero.

    p.transaction_id = packet_received.transaction_id
    p.seconds_elapsed = 0
    p.bootp_flags = 0  # unicast

    p.client_mac_address = packet_received.client_mac_address
    p.magic_cookie = packet_received.magic_cookie

    p.client_ip_address = '0.0.0.0'
    # TODO: This is specific to the pool, obviously.
    p.next_server_ip_address = '10.80.44.57'
    p.relay_agent_ip_address = '0.0.0.0'

    # options
    p.parameter_order = packet_received.parameter_request_list
    p.subnet_mask = str(pool.getNetwork().netmask)
    # TODO: This is specific to the pool, obviously.
    p.router = ['10.80.44.57']
    p.domain_name_server = ['8.8.8.8', '8.8.4.4']
    p.host_name = 'raspbi-netboot'
    p.root_path = '/sdf.img'

    return p


def createOffer(packet_received: packet.Packet, pool: Pool) -> packet.Packet:
    p = createCommon(packet_received, pool)

    p.dhcp_message_type = 'DHCPOFFER'
    p.your_ip_address = \
            str(pool.getUnused(packet_received.client_mac_address))

    return p


def createAck(packet_received: packet.Packet, pool: Pool) -> packet.Packet:
    if not pool.renew(
        packet_received.requested_ip_address,
        packet_received.client_mac_address):
        return None

    p = createCommon(packet_received, pool)
    p.dhcp_message_type = 'DHCPACK'
    p.your_ip_address = packet_received.requested_ip_address

    return p


def main(argv):
    responsible_mac_regex = re.compile(FLAGS.responsible_mac_regex)

    receiver = Receiver(FLAGS.interface)
    sender = Sender(FLAGS.interface)
    local_ip = sender.getIP()
    print(local_ip)
    pool = Pool('10.80.44.0/24', '10.80.44.110', '10.80.44.120')

    while True:
        dhcp_packet = receiver.waitForPacket()

        # We only care about requests, no replies.
        if dhcp_packet.message_type == 1:
            if dhcp_packet.dhcp_message_type == 'DHCPDISCOVER':
                print('Received DHCPDISCOVER from {}'.format(dhcp_packet.client_mac_address))
                if isResponsible(dhcp_packet.client_mac_address, responsible_mac_regex):
                    print('We are responsible')
                    response_packet = createOffer(dhcp_packet, pool)
                    print(response_packet)
                    sender.sendPacket(response_packet)

            elif dhcp_packet.dhcp_message_type == 'DHCPREQUEST':
                print('Received DHCPREQUEST')
                if isResponsible(dhcp_packet.client_mac_address, responsible_mac_regex):
                    print('We are responsible')
                    response_packet = createAck(dhcp_packet, pool)
                    if response_packet:
                        print(response_packet)
                        sender.sendPacket(response_packet)
                    else:
                        print('The IP does not seem to belong to us. Ignoring it')
            elif dhcp_packet.dhcp_message_type == 'DHCPOFFER':
                print('Received DHCPOFFER. Ignoring it.')
            elif dhcp_packet.dhcp_message_type == 'DHCPACK':
                print('Received DHCPACK. Ignoring it.')
            elif dhcp_packet.dhcp_message_type == 'DHCPNAK':
                print('Received DHCPNACK. Ignoring it.')
            else:
                print('Unknown message type {}'.format(dhcp_packet.dhcp_message_type))

if __name__ == '__main__':
    app.run(main)
