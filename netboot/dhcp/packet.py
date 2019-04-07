# Based on http://github.com/niccokunzmann/python_dhcp_server.git
import struct
import base64
from socket import inet_ntoa, inet_aton


dhcp_message_types = {
    1 : 'DHCPDISCOVER',
    2 : 'DHCPOFFER',
    3 : 'DHCPREQUEST',
    4 : 'DHCPDECLINE',
    5 : 'DHCPACK',
    6 : 'DHCPNAK',
    7 : 'DHCPRELEASE',
    8 : 'DHCPINFORM',
}
reversed_dhcp_message_types = dict()
for i, v in dhcp_message_types.items():
    reversed_dhcp_message_types[v] = i
del i, v


shortunpack = lambda data: (data[0] << 8) + data[1]
shortpack = lambda i: bytes([i >> 8, i & 255])


def macunpack(data):
    s = base64.b16encode(data)
    return ':'.join([s[i:i+2].decode('ascii') for i in range(0, 12, 2)])


def macpack(mac):
    return base64.b16decode(mac.replace(':', '').replace('-', '').encode('ascii'))


def unpackbool(data):
    return data[0]


def packbool(bool):
    return bytes([bool])


def inet_ntoaX(data):
    return ['.'.join(map(str, data[i:i + 4])) for i in range(0, len(data), 4)]


def inet_atonX(ips):
    return b''.join(map(inet_aton, ips))


options = [
# RFC1497 vendor extensions
    ('pad', None, None),
    ('subnet_mask', inet_ntoa, inet_aton),
    ('time_offset', None, None),
    ('router', inet_ntoaX, inet_atonX),
    ('time_server', inet_ntoaX, inet_atonX),
    ('name_server', inet_ntoaX, inet_atonX),
    ('domain_name_server', inet_ntoaX, inet_atonX),
    ('log_server', inet_ntoaX, inet_atonX),
    ('cookie_server', inet_ntoaX, inet_atonX),
    ('lpr_server', inet_ntoaX, inet_atonX),
    ('impress_server', inet_ntoaX, inet_atonX),
    ('resource_location_server', inet_ntoaX, inet_atonX),
    ('host_name', lambda d: d.decode('ASCII'), lambda d: d.encode('ASCII')),
    ('boot_file_size', None, None),
    ('merit_dump_file', None, None),
    ('domain_name', None, None),
    ('swap_server', inet_ntoa, inet_aton),
    ('root_path', lambda d: d.decode('ASCII'), lambda d: d.encode('ASCII')),
    ('extensions_path', None, None),
# IP Layer Parameters per Host
    ('ip_forwarding_enabled', unpackbool, packbool),
    ('non_local_source_routing_enabled', unpackbool, packbool),
    ('policy_filer', None, None),
    ('maximum_datagram_reassembly_size', shortunpack, shortpack),
    ('default_ip_time_to_live', lambda data: data[0], lambda i: bytes([i])),
    ('path_mtu_aging_timeout', None, None),
    ('path_mtu_plateau_table', None, None),
# IP Layer Parameters per Interface
    ('interface_mtu', None, None),
    ('all_subnets_are_local', unpackbool, packbool),
    ('broadcast_address', inet_ntoa, inet_aton),
    ('perform_mask_discovery', unpackbool, packbool),
    ('mask_supplier', None, None),
    ('perform_router_discovery', None, None),
    ('router_solicitation_address', inet_ntoa, inet_aton),
    ('static_route', None, None),
# Link Layer Parameters per Interface
    ('trailer_encapsulation_option', None, None),
    ('arp_cache_timeout', None, None),
    ('ethernet_encapsulation', None, None),
# TCP Parameters
    ('tcp_default_ttl', None, None),
    ('tcp_keep_alive_interval', None, None),
    ('tcp_keep_alive_garbage', None, None),
# Application and Service Parameters Part 1
    ('network_information_service_domain', None, None),
    ('network_informtaion_servers', inet_ntoaX, inet_atonX),
    ('network_time_protocol_servers', inet_ntoaX, inet_atonX),
    ('vendor_specific_information', None, None),
    ('netbios_over_tcp_ip_name_server', inet_ntoaX, inet_atonX),
    ('netbios_over_tcp_ip_datagram_distribution_server', inet_ntoaX, inet_atonX),
    ('netbios_over_tcp_ip_node_type', None, None),
    ('netbios_over_tcp_ip_scope', None, None),
    ('x_window_system_font_server', inet_ntoaX, inet_atonX),
    ('x_window_system_display_manager', inet_ntoaX, inet_atonX),
# DHCP Extensions
    ('requested_ip_address', inet_ntoa, inet_aton),
    ('ip_address_lease_time', lambda d: struct.unpack('>I', d)[0], lambda i: struct.pack('>I', i)),
    ('option_overload', None, None),
    ('dhcp_message_type', lambda data: dhcp_message_types.get(data[0], data[0]), (lambda name: bytes([reversed_dhcp_message_types.get(name, name)]))),
    ('server_identifier', inet_ntoa, inet_aton),
    ('parameter_request_list', list, bytes),
    ('message', None, None),
    ('maximum_dhcp_message_size', shortunpack, shortpack),
    ('renewal_time_value', None, None),
    ('rebinding_time_value', None, None),
    ('vendor_class_identifier', None, None),
    ('client_identifier', macunpack, macpack),
    ('tftp_server_name', None, None),
    ('boot_file_name', None, None),
# Application and Service Parameters Part 2
    ('network_information_service_domain', None, None),
    ('network_information_servers', inet_ntoaX, inet_atonX),
    ('', None, None),
    ('', None, None),
    ('mobile_ip_home_agent', inet_ntoaX, inet_atonX),
    ('smtp_server', inet_ntoaX, inet_atonX),
    ('pop_servers', inet_ntoaX, inet_atonX),
    ('nntp_server', inet_ntoaX, inet_atonX),
    ('default_www_server', inet_ntoaX, inet_atonX),
    ('default_finger_server', inet_ntoaX, inet_atonX),
    ('default_irc_server', inet_ntoaX, inet_atonX),
    ('streettalk_server', inet_ntoaX, inet_atonX),
    ('stda_server', inet_ntoaX, inet_atonX),
    ]


class Packet:

    for i, o in enumerate(options):
        locals()[o[0]] = None
        locals()['option_{0}'.format(i)] = None
    del i, o

    def __init__(self):
        self.options = {}
        self.named_options = {}
        pass

    def _parse(self, data, address):
        self.address = address
        self.host = address[0]
        self.port = address[1]

        self.message_type = data[0]
        self.hardware_type = data[1]
        self.hardware_address_length = data[2]
        self.hops = data[3]

        self.transaction_id = struct.unpack('>I', data[4:8])[0]

        self.seconds_elapsed = shortunpack(data[8:10])
        self.bootp_flags = shortunpack(data[8:10])

        self.client_ip_address = inet_ntoa(data[12:16])
        self.your_ip_address   = inet_ntoa(data[16:20])
        self.next_server_ip_address = inet_ntoa(data[20:24])
        self.relay_agent_ip_address = inet_ntoa(data[24:28])

        self.client_mac_address = macunpack(data[28: 28 + self.hardware_address_length])
        index = 236
        self.magic_cookie = inet_ntoa(data[index:index + 4]); index += 4
        self.options = {}
        self.named_options = {}
        while index < len(data):
            option = data[index]; index += 1
            if option == 0:
                # padding
                continue
            if option == 255:
                # end
                break
            option_length = data[index]; index += 1
            option_data = data[index: index + option_length]; index += option_length
            self.options[option] = option_data
            if option < len(options):
                option_name, function, _ = options[option]
                if function:
                    option_data = function(option_data)
                if option_name:
                    setattr(self, option_name, option_data)
                    self.named_options[option_name] = option_data
            setattr(self, 'option_{}'.format(option), option_data)

    @staticmethod
    def parse(data, address=('0.0.0.0', 0)):
        # We are creating a new Packet here.
        p = Packet()
        p._parse(data, address)
        return p

    def toBytes(self):
        result = bytearray(236)

        result[0] = self.message_type
        result[1] = self.hardware_type
        result[2] = self.hardware_address_length
        result[3] = self.hops

        result[4:8] = struct.pack('>I', self.transaction_id)

        result[ 8:10] = shortpack(self.seconds_elapsed)
        result[10:12] = shortpack(self.bootp_flags)

        result[12:16] = inet_aton(self.client_ip_address)
        result[16:20] = inet_aton(self.your_ip_address)
        result[20:24] = inet_aton(self.next_server_ip_address)
        result[24:28] = inet_aton(self.relay_agent_ip_address)

        result[28:28 + self.hardware_address_length] = macpack(self.client_mac_address)

        result += inet_aton(self.magic_cookie)

        for option in self.w_options:
            value = self.get_option(option)
            if value is None:
                continue
            result += bytes([option, len(value)]) + value
        result += bytes([255])
        return bytes(result)

    def get_option(self, option):
        if option < len(options) and hasattr(self, options[option][0]):
            value = getattr(self, options[option][0])
        elif hasattr(self, 'option_{}'.format(option)):
            value = getattr(self, 'option_{}'.format(option))
        else:
            return None
        function = options[option][2]
        if function and value is not None:
            value = function(value)
        return value

    @property
    def w_options(self):
        done = list()
        # fulfill wishes
        for option in self.parameter_order:
            if option < len(options) and hasattr(self, options[option][0]) or hasattr(self, 'option_{}'.format(option)):
                # this may break with the specification because we must try to fulfill the wishes
                if option not in done:
                    done.append(option)
        # add my stuff
        for option, o in enumerate(options):
            if o[0] and hasattr(self, o[0]):
                if option not in done:
                    done.append(option)
        for option in range(256):
            if hasattr(self, 'option_{}'.format(option)):
                if option not in done:
                    done.append(option)
        return done

    def __getitem__(self, key):
        print(key, dir(self))
        return getattr(self, key, None)

    def __contains__(self, key):
        return key in self.__dict__

    @property
    def formatted_named_options(self):
        return "\n".join("{}:\t{}".format(name.replace('_', ' '), value) for name, value in sorted(self.named_options.items()))

    def __str__(self):
        fmt = ("Message Type: {self.message_type}\n"
               " client MAC address: {self.client_mac_address}\n"
               " client IP address: {self.client_ip_address}\n"
               " your IP address: {self.your_ip_address}\n"
               " next server IP address: {self.next_server_ip_address}\n"
               " {self.formatted_named_options}\n")
        return fmt.format(self = self)
