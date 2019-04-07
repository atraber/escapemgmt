# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import datetime
import ipaddress


class Lease:
    def __init__(self, addr: ipaddress.IPv4Address, mac: str):
        self.addr = addr
        self.mac = mac
        self.created_at = datetime.datetime.now()
        self.renewed_at = self.created_at

    def _renew(self) -> None:
        self.renewed_at = datetime.datetime.now()


class Pool:
    def __init__(self, network: str, start: str, end: str):
        self.lease_time = datetime.timedelta(minutes=30)
        self.network = ipaddress.ip_network(network)
        self.start = ipaddress.ip_address(start)
        self.end = ipaddress.ip_address(end)

        # Check that start and end are part of the network.
        start_network = ipaddress.ip_interface(
                '{}/{}'.format(start, self.network.prefixlen))
        end_network = ipaddress.ip_interface(
                '{}/{}'.format(end, self.network.prefixlen))

        assert self.network == start_network.network
        assert self.network == end_network.network

        addr_list = []
        addr = self.start
        while addr <= self.end:
            addr_list.append(addr)
            addr += 1

        assert len(addr_list) > 0

        self.mac_lut = {}
        self.leases = {}
        for p in addr_list:
            self.leases[p] = None

        self.unused_addrs = set(addr_list)

    def getUnused(self, mac: str) -> ipaddress.IPv4Address:
        """Get an unused address and reserve it."""
        if len(self.unused_addrs) == 0:
            self._removeExpiredLeases()

        try:
            addr = self.mac_lut[mac]
            if self.renew(str(addr), mac):
                return addr
            raise Exception("This should not happen")
        except KeyError:
            # Not in our LUT
            pass

        try:
            addr = self.unused_addrs.pop()
            assert self.leases[addr] is None
            self.leases[addr] = Lease(addr, mac)
            self.mac_lut[mac] = addr
            return addr
        except (AssertionError, KeyError):
            raise KeyError

    def renew(self, addr_str: str, mac: str) -> bool:
        addr = ipaddress.ip_address(addr_str)
        try:
            lease = self.leases[addr]
        except KeyError:
            # Not part of our pool.
            return False

        if lease is None:
            # Lease has expired but is available, thus let's get it.
            self.unused_addrs.remove(addr)
            self.leases[addr] = Lease(addr, mac)
            self.mac_lut[mac] = addr
            return True
        else:
            if lease.mac == mac:
                lease._renew()
                return True

        # Could not renew lease.
        return False

    def _removeExpiredLeases(self) -> bool:
        # TODO: This could be solved more efficiently. I'm pretty sure this
        # whole thing could be done in O(log(n)). The following algorithm is
        # only O(n).
        expire_before = datetime.datetime.now() - self.lease_time
        for addr, lease in self.leases.items():
            if lease is None:
                continue
            if lease.renewed_at < expire_before:
                self.leases[addr] = None
                self.mac_lut.remove(lease.mac)
                self.unused_addrs.push(addr)

    def getNetwork(self) -> ipaddress.IPv4Network:
        return self.network
