import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, CornerDownLeft, Trash2, HelpCircle } from 'lucide-react';
import { Mission } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface CiscoTerminalProps {
  mission: Mission;
}

interface CommandLog {
  id: string;
  command: string;
  output: string;
  isError?: boolean;
}

export const CiscoTerminal: React.FC<CiscoTerminalProps> = ({ mission }) => {
  const { language } = useLanguage();
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<CommandLog[]>([
    {
      id: 'init-1',
      command: 'system-init',
      output: language === 'th'
        ? `Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(2)E4\nเชื่อมต่อหน้าต่างตรวจสอบกับ Switch และ Gateway ของ${mission.department}แล้ว\nพิมพ์ "help" หรือเลือกคำสั่งด้านล่างเพื่อตรวจสอบเครือข่ายจำลอง`
        : `Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(2)E4\nDiagnostic Console connected to ${mission.department} switch & gateway.\nType "help" or click diagnostic chips below to test simulated network telemetry.`
    }
  ]);

  useEffect(() => {
    setLogs([{
      id: 'init-1',
      command: 'system-init',
      output: language === 'th'
        ? `Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(2)E4\nเชื่อมต่อหน้าต่างตรวจสอบกับ Switch และ Gateway ของ${mission.department}แล้ว\nพิมพ์ "help" หรือเลือกคำสั่งด้านล่างเพื่อตรวจสอบเครือข่ายจำลอง`
        : `Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(2)E4\nDiagnostic Console connected to ${mission.department} switch & gateway.\nType "help" or click diagnostic chips below to test simulated network telemetry.`
    }]);
  }, [language, mission.id, mission.department]);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim().toLowerCase();
    if (!trimmed) return;

    let output = '';
    let isError = false;

    if (trimmed === 'clear' || trimmed === 'cls') {
      setLogs([]);
      setInput('');
      return;
    } else if (trimmed === 'help' || trimmed === '?') {
      output = language === 'th'
        ? `คำสั่งตรวจสอบที่รองรับ:\n  - ping <ip>                  ทดสอบการเชื่อมต่อด้วย ICMP\n  - traceroute <ip>            ตรวจสอบเส้นทาง\n  - ipconfig /all              แสดงค่าการ์ดเครือข่าย\n  - show ip interface brief    สรุป IP และสถานะ Interface\n  - show vlan brief            ตรวจสอบ VLAN และการกำหนด Port\n  - show interfaces trunk      ตรวจสอบ VLAN ที่ผ่าน 802.1Q Trunk\n  - show ip route              แสดง Routing Table\n  - show ip ospf neighbor      ตรวจสอบ OSPF Adjacency\n  - clear                      ล้างหน้าต่าง Terminal`
        : `Supported Diagnostic Commands:\n  - ping <ip>                  Test ICMP reachability\n  - traceroute <ip>            Trace route hops\n  - ipconfig /all              Display workstation network adapter details\n  - show ip interface brief    Summary of interface IP and line protocol\n  - show vlan brief            Verify VLAN database and port access mapping\n  - show interfaces trunk      Inspect 802.1Q trunk allowed VLANs\n  - show ip route              Display routing table entries\n  - show ip ospf neighbor      Inspect dynamic OSPF adjacencies\n  - clear                      Clear terminal window`;
    } else if (trimmed.startsWith('ping')) {
      const target = trimmed.split(' ')[1] || '192.168.10.1';
      if (mission.id === 1) {
        output = `Sending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5).\nFastEthernet0/1 link line protocol is down (no carrier).`;
        isError = true;
      } else if (mission.id === 4) {
        if (target.startsWith('10.0')) {
          output = `Pinging ${target} with 32 bytes of data:\nRequest timed out.\nDestination host unreachable (Gateway 192.168.1.1 on foreign subnet).\nPackets: Sent = 4, Received = 0, Lost = 4 (100% loss).`;
          isError = true;
        } else {
          output = `Pinging ${target} with 32 bytes of data:\nReply from ${target}: bytes=32 time=1ms TTL=128\nReply from ${target}: bytes=32 time=1ms TTL=128\nPackets: Sent = 4, Received = 4, Lost = 0 (0% loss).`;
        }
      } else if (mission.id === 5) {
        output = `Pinging ${target} with 32 bytes of data:\nRequest timed out.\nFastEthernet0/12 is administratively down.\nPackets: Sent = 4, Received = 0, Lost = 4 (100% loss).`;
        isError = true;
      } else {
        output = `Pinging ${target} with 32 bytes of data:\nReply from ${target}: bytes=32 time=2ms TTL=64\nReply from ${target}: bytes=32 time=1ms TTL=64\nSuccess rate is 100 percent (4/4).`;
      }
    } else if (trimmed.includes('show ip int') || trimmed.includes('show ip interface')) {
      output = `Interface              IP-Address      OK? Method Status                Protocol\nFastEthernet0/1        unassigned      YES unset  ${mission.id === 1 ? 'down                  down' : 'up                    up'}\nFastEthernet0/2        unassigned      YES unset  up                    up\nFastEthernet0/12       unassigned      YES unset  ${mission.id === 5 ? 'administratively down down' : 'up                    up'}\nGigabitEthernet0/1     192.168.10.1    YES manual up                    up\nGigabitEthernet0/2     10.0.0.1        YES manual up                    up`;
    } else if (trimmed.includes('ipconfig')) {
      output = `Windows IP Configuration\n\nEthernet adapter Local Area Connection:\n   Connection-specific DNS Suffix  . : corp.local\n   IPv4 Address. . . . . . . . . . . : ${mission.id === 2 ? '192.168.1.55 (Wrong Subnet!)' : '192.168.10.12'}\n   Subnet Mask . . . . . . . . . . . : ${mission.id === 3 ? '255.255.255.192 (/26 Isolated!)' : '255.255.255.0'}\n   Default Gateway . . . . . . . . . : ${mission.id === 4 ? '192.168.1.1 (MISCONFIGURED)' : '192.168.10.1'}\n   DNS Servers . . . . . . . . . . . : ${mission.id === 11 ? '8.8.8.8 (Public resolver)' : '192.168.10.53'}`;
    } else if (trimmed.includes('show vlan')) {
      output = `VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    ${mission.id === 6 ? 'Fa0/1, Fa0/2, Fa0/8 (MISMAPPED)' : 'Fa0/1, Fa0/2'}\n10   Accounting                       active    Fa0/3, Fa0/4\n20   Marketing                        active    Fa0/5, Fa0/6\n30   Engineering                      active    ${mission.id === 6 ? 'Fa0/18 (Missing Fa0/8!)' : 'Fa0/8, Fa0/18'}`;
    } else if (trimmed.includes('show interfaces trunk')) {
      output = `Port        Mode         Encapsulation  Status        Native vlan\nGi0/1       on           802.1q         trunking      ${mission.id === 12 ? '99 (MISMATCH!)' : '1'}\n\nPort        Vlans allowed on trunk\nGi0/1       ${mission.id === 7 ? '10,20 (VLAN 40 DROPPED!)' : '1-4094'}`;
    } else if (trimmed.includes('show ip route')) {
      output = `Codes: L - local, C - connected, S - static, R - RIP, O - OSPF\n\nGateway of last resort is not set\n\n      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks\nC        10.254.1.0/30 is directly connected, Serial0/0/0\n      192.168.88.0/24 is subnetted, 1 subnets\nC        192.168.88.0 is directly connected, GigabitEthernet0/0\n${mission.id === 8 ? '% Network 172.16.0.0/16 is not in table (Missing Static Route!)' : 'S        172.16.0.0/16 [1/0] via 10.254.1.1'}`;
    } else if (trimmed.includes('show ip ospf neighbor')) {
      output = mission.id === 9 
        ? `% OSPF: Neighbor adjacency failed on GigabitEthernet0/0/1\nReason: Mismatched Area ID (Local Area 0 vs Remote Area 1)`
        : `Neighbor ID     Pri   State           Dead Time   Address         Interface\n10.0.12.2         1   FULL/BDR        00:00:33    10.0.12.2       GigabitEthernet0/0/1`;
    } else {
      output = language === 'th' ? `% ไม่รู้จักคำสั่ง "${trimmed}" พิมพ์ "help" เพื่อดูคำสั่งที่รองรับ` : `% Unknown diagnostic command "${trimmed}". Type "help" for a list of available verification commands.`;
      isError = true;
    }

    setLogs(prev => [...prev, {
      id: Math.random().toString(),
      command: cmdStr,
      output,
      isError
    }]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    }
  };

  const quickChips = [
    'ipconfig /all',
    'ping 192.168.10.1',
    'show ip interface brief',
    'show vlan brief',
    'show interfaces trunk',
    'show ip route'
  ];

  return (
    <div id="cisco-simulated-cli" className="bg-[#0B0F14] border border-[#263241] rounded-lg overflow-hidden font-mono text-xs shadow-xl">
      {/* Terminal Title Bar */}
      <div className="bg-[#111820] border-b border-[#263241] px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5252]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5C542]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71]"></span>
          </div>
          <span className="ml-1 flex min-w-0 items-center gap-1.5 truncate text-[10px] font-bold text-[#8D9BA8] sm:ml-2 sm:text-[11px]">
            <TerminalIcon className="w-3.5 h-3.5 text-[#F5C542]" />
            Cisco IOS {language === 'th' ? 'หน้าต่างตรวจสอบ' : 'Diagnostic Terminal'} — {mission.incident_id}
          </span>
        </div>
        <button
          onClick={() => setLogs([])}
          title={language === 'th' ? 'ล้างหน้าจอ' : 'Clear screen'}
          className="text-[#8D9BA8] hover:text-[#F4F6F8] p-1 rounded hover:bg-[#161F29]"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Terminal Output Area */}
      <div className="p-4 h-64 overflow-y-auto space-y-3 bg-[#0B0F14]">
        {logs.map((log) => (
          <div key={log.id} className="space-y-1">
            <div className="flex items-center gap-1.5 text-[#00C2FF]">
              <span>Switch#</span>
              <span className="text-[#F4F6F8]">{log.command}</span>
            </div>
            <pre className={`whitespace-pre-wrap leading-relaxed ${
              log.isError ? 'text-[#FF5252]' : 'text-[#8D9BA8]'
            }`}>
              {log.output}
            </pre>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Quick Diagnostic Command Chips */}
      <div className="px-3 py-2 bg-[#111820]/90 border-t border-[#263241] flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] text-[#8D9BA8] uppercase mr-1">{language === 'th' ? 'คำสั่งด่วน:' : 'Quick Inspect:'}</span>
        {quickChips.map((chip) => (
          <button
            key={chip}
            onClick={() => handleCommand(chip)}
            className="text-[10px] px-2 py-0.5 rounded bg-[#161F29] hover:bg-[#263241] text-[#00C2FF] border border-[#263241] transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Command Input Prompt */}
      <div className="p-2.5 bg-[#111820] border-t border-[#263241] flex items-center gap-2">
        <span className="text-[#00C2FF] font-bold">Switch#</span>
        <input
          id="terminal-cli-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={language === 'th' ? 'พิมพ์คำสั่ง เช่น "ping 192.168.10.1", "show ip route", "help"...' : 'Type command (e.g. "ping 192.168.10.1", "show ip route", "help")...'}
          className="flex-1 bg-transparent text-[#F4F6F8] focus:outline-none placeholder-[#8D9BA8]/50"
        />
        <button
          onClick={() => handleCommand(input)}
          className="p-1 px-2 rounded bg-[#F5C542]/10 text-[#F5C542] hover:bg-[#F5C542]/20 border border-[#F5C542]/40 transition-colors flex items-center gap-1 text-[11px]"
        >
          <span>{language === 'th' ? 'เรียกใช้' : 'Run'}</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
