import type { Achievement, AssessmentQuestion, Hint, Mission, Question } from '../types';
import type { Language } from './LanguageContext';

type MissionThai = {
  title: string;
  description: string;
  difficulty: string;
  category: string;
  stage_name: string;
  estimated_time: string;
  department: string;
  reported_time: string;
  priority: string;
  scenario_text: string;
  checklists: string[];
};

const missionThai: Record<number, MissionThai> = {
  1: { title: 'ภารกิจ 01 — สายสัญญาณขาดการเชื่อมต่อ', description: 'เครื่องคอมพิวเตอร์ในฝ่ายบัญชีไม่สามารถเชื่อมต่อกับ Switch ภายในได้หลังจากมีการย้ายโต๊ะทำงาน', difficulty: 'ง่าย', category: 'พื้นฐานเครือข่าย', stage_name: 'พื้นฐานเครือข่าย', estimated_time: '15 นาที', department: 'ฝ่ายบัญชีและเงินเดือน', reported_time: 'วันนี้ 09:15 น.', priority: 'สูง', scenario_text: 'ผู้ใช้ในฝ่ายบัญชีแจ้งว่าไฟสถานะการเชื่อมต่อของ PC-01 เป็นสีแดง ไม่สามารถ ping ไปยัง Default Gateway หรือใช้บริการภายในได้ โดยมีการเปลี่ยนสายสัญญาณระหว่างการจัดวางโต๊ะใหม่', checklists: ['ตรวจสอบไฟสถานะ NIC ของ PC-01', 'ตรวจสอบสายระหว่าง PC-01 กับพอร์ต FastEthernet0/1 ของ Switch', 'ใช้คำสั่ง show interfaces fastethernet 0/1 เพื่อตรวจสอบ Line Protocol และสัญญาณ', 'ตรวจสอบป้ายกำกับ Patch Panel ให้ตรงกับพอร์ตบน Switch'] },
  2: { title: 'ภารกิจ 02 — Subnet ไม่ตรงกันและ IP ผิดเครือข่าย', description: 'เครื่องของผู้รับเหมาถูกกำหนด Static IP ผิดช่วงเครือข่าย ทำให้ติดต่อ Default Gateway ผ่าน ARP ไม่ได้', difficulty: 'ง่าย', category: 'การกำหนด IP', stage_name: 'พื้นฐานเครือข่าย', estimated_time: '18 นาที', department: 'ห้องปฏิบัติการวิศวกรรม', reported_time: 'วันนี้ 10:30 น.', priority: 'ปานกลาง', scenario_text: 'ช่างเครือข่ายที่เข้ามาปฏิบัติงานไม่สามารถเข้าถึงคลังไฟล์ของห้องปฏิบัติการได้ แม้ไฟสถานะเครือข่ายเป็นสีเขียว แต่การ ping ไปยัง Gateway 192.168.10.1 แสดงข้อความ Destination Host Unreachable', checklists: ['ตรวจสอบค่า IP ของเครื่องผู้รับเหมาด้วย ipconfig /all', 'เปรียบเทียบ Subnet ของเครื่องกับ IP บน Interface Gig0/0 ของ R1', 'วิเคราะห์สาเหตุที่ ARP Request สำหรับ 192.168.10.1 ทำงานในเครือข่ายนี้ไม่ได้', 'กำหนด Static IPv4 ให้อยู่ในช่วง 192.168.10.0/24'] },
  3: { title: 'ภารกิจ 03 — Subnet Mask ผิดทำให้เครือข่ายแยกออกจากกัน', description: 'เครื่องฝ่ายบัญชีติดต่อ Payroll Server ไม่ได้ เพราะ Subnet Mask /26 แบ่งอุปกรณ์ออกเป็นคนละ Subnet', difficulty: 'ง่าย', category: 'การแบ่ง Subnet', stage_name: 'พื้นฐานเครือข่าย', estimated_time: '20 นาที', department: 'ฝ่ายการเงิน', reported_time: 'วันนี้ 11:45 น.', priority: 'สูง', scenario_text: 'PC-03 (192.168.50.70) ในฝ่ายการเงินติดต่อ SRV-01 (192.168.50.10) ไม่ได้ แม้ช่างเข้าใจว่าอยู่ Subnet เดียวกัน แต่ PC-03 ถูกกำหนด Subnet Mask เป็น 255.255.255.192 (/26)', checklists: ['คำนวณขนาด Network Block ของ 255.255.255.192 (/26)', 'ระบุว่า 192.168.50.10 และ 192.168.50.70 อยู่ใน /26 ใด', 'สังเกตว่า PC-03 มอง 192.168.50.10 เป็นปลายทางต่าง Subnet', 'แก้ Subnet Mask ของ PC-03 เป็น 255.255.255.0 ตามแบบเครือข่าย'] },
  4: { title: 'ภารกิจ 04 — ไม่พบ Default Gateway', description: 'ผู้ใช้ฝ่ายบัญชีติดต่อสาขาภายนอกและ Cloud Portal ไม่ได้ แต่ยัง ping ระบบ Intranet ภายในได้', difficulty: 'ง่าย', category: 'Default Gateway', stage_name: 'Switching และ Gateway', estimated_time: '20 นาที', department: 'ฝ่ายบัญชี', reported_time: 'วันนี้ 13:15 น.', priority: 'สูง', scenario_text: 'ผู้ใช้ฝ่ายบัญชีไม่สามารถเข้าถึง Server ใน Data Center ที่ Subnet 10.0.0.50 ได้ ขณะที่แผนกอื่นใช้งานได้ตามปกติ และยังสื่อสารกับเครื่องใน 192.168.10.0/24 ได้', checklists: ['ใช้ ipconfig บน PC-01 และตรวจสอบ Default Gateway', 'เปรียบเทียบ Gateway ของ PC-01 กับ PC-02 ที่ใช้งานได้', 'ทดสอบ ping จาก PC-01 ไปยัง 192.168.10.1 ซึ่งเป็น Interface ภายในของ Router', 'แก้ Default Gateway เป็น 192.168.10.1 แล้วทดสอบ ping ไปยัง 10.0.0.50'] },
  5: { title: 'ภารกิจ 05 — พอร์ต Switch ถูกปิดโดยผู้ดูแล', description: 'เครื่องพิมพ์สำคัญของฝ่ายการตลาดหายไปจากเครือข่ายหลังการบำรุงรักษาช่วงกลางคืน', difficulty: 'ปานกลาง', category: 'Switching', stage_name: 'Switching และ Gateway', estimated_time: '20 นาที', department: 'ฝ่ายการตลาดและออกแบบ', reported_time: 'วันนี้ 14:40 น.', priority: 'ปานกลาง', scenario_text: 'เครื่องพิมพ์ส่วนกลาง Printer-MKT ที่พอร์ต Fa0/12 ของ Switch SW-B2 ไม่ตอบสนองต่อ ping หรืองานพิมพ์ และไฟพอร์ต 12 เป็นสีเหลืองหรือดับ', checklists: ['เชื่อมต่อ Console หรือ Telnet ไปยัง Switch SW-B2', 'ใช้คำสั่ง show ip interface brief | include FastEthernet0/12', 'ตรวจพบสถานะ administratively down และ Line Protocol เป็น down', 'เข้า Interface Configuration Mode และใช้คำสั่ง no shutdown'] },
  6: { title: 'ภารกิจ 06 — การแยกเครือข่ายจากการกำหนด VLAN ผิด', description: 'เครื่องนักพัฒนาเครื่องใหม่เข้าถึงบริการภายในไม่ได้ เพราะพอร์ตถูกกำหนด VLAN ไม่ถูกต้อง', difficulty: 'ปานกลาง', category: 'VLAN', stage_name: 'Switching และ Gateway', estimated_time: '25 นาที', department: 'ฝ่ายพัฒนาซอฟต์แวร์', reported_time: 'วันนี้ 15:50 น.', priority: 'สูง', scenario_text: 'PC-DEV (192.168.30.45) ควรอยู่ VLAN 30 แต่พอร์ต Fa0/8 ถูกกำหนดเป็น VLAN 1 ทำให้ Broadcast และ ARP ไปไม่ถึง Gateway Sub-interface ของ VLAN 30', checklists: ['ตรวจสอบ VLAN ปัจจุบันด้วย show vlan brief', 'ตรวจสอบพอร์ต FastEthernet0/8 ในตาราง VLAN', 'ยืนยันว่ามี VLAN 30 อยู่ในฐานข้อมูลของ Switch', 'ใช้ interface fa0/8 ตามด้วย switchport mode access และ switchport access vlan 30'] },
  7: { title: 'ภารกิจ 07 — การกำหนด 802.1Q Trunk ผิด', description: 'Trunk ระหว่าง Switch ทิ้ง Traffic ของ Voice VLAN และ Operations VLAN เพราะไม่มี VLAN ในรายการที่อนุญาต', difficulty: 'ปานกลาง', category: 'Switching', stage_name: 'Routing และบริการเครือข่าย', estimated_time: '25 นาที', department: 'ฝ่ายปฏิบัติการ', reported_time: 'เมื่อวาน 16:10 น.', priority: 'สูง', scenario_text: 'Switch SW2 เชื่อมกับ Core Switch SW1 ผ่าน GigabitEthernet0/1 แต่ผู้ใช้ VLAN 40 บน SW2 ติดต่อบริการบน SW1 ไม่ได้ เมื่อตรวจสอบพบว่า Trunk ของ SW1 อนุญาตเฉพาะ VLAN 10 และ 20', checklists: ['ตรวจสอบ Trunk ด้วย show interfaces trunk', 'ตรวจสอบบรรทัด Vlans allowed on trunk ของ Gig0/1 บน Switch ทั้งสองตัว', 'เพิ่ม VLAN 40 โดยไม่แทนที่รายการเดิมด้วย switchport trunk allowed vlan add 40', 'ทดสอบ ping ระหว่าง Ops Station และ Ops Controller'] },
  8: { title: 'ภารกิจ 08 — ไม่มี Static Route', description: 'Router ของสาขาติดต่อฐานข้อมูลสำนักงานใหญ่ไม่ได้ เพราะ Routing Table ไม่มีเส้นทางไปยัง 172.16.0.0/16', difficulty: 'ปานกลาง', category: 'Routing', stage_name: 'Routing และบริการเครือข่าย', estimated_time: '25 นาที', department: 'สำนักงานสาขาภาคเหนือ', reported_time: 'วันนี้ 08:30 น.', priority: 'สูง', scenario_text: 'พนักงานสาขาภาคเหนือติดต่อ Oracle Database ที่สำนักงานใหญ่ 172.16.100.5 ไม่ได้ โดย R-Branch ไม่มีทั้ง Default Route และ Static Route ผ่าน Serial WAN', checklists: ['ตรวจสอบ Routing Table บน Branch Router ด้วย show ip route', 'ยืนยันว่ามี Route ที่ตรงกับ 172.16.100.5 หรือไม่', 'ระบุ Next Hop บน Serial Link ฝั่งสำนักงานใหญ่ คือ 10.254.1.1', 'กำหนด ip route 172.16.0.0 255.255.0.0 10.254.1.1'] },
  9: { title: 'ภารกิจ 09 — OSPF Neighbor สร้าง Adjacency ไม่สำเร็จ', description: 'Core Router สองตัวสร้าง OSPF Adjacency ไม่ได้ เพราะ Area ID บน Point-to-Point Link ไม่ตรงกัน', difficulty: 'ยาก', category: 'Routing', stage_name: 'Routing และบริการเครือข่าย', estimated_time: '30 นาที', department: 'โครงสร้างพื้นฐานส่วนกลาง', reported_time: 'วันนี้ 09:00 น.', priority: 'วิกฤต', scenario_text: 'R1 และ R2 เชื่อมกันผ่าน GigabitEthernet0/0/1 แต่สถานะ OSPF Neighbor ค้างที่ INIT/DOWN แม้รับ Hello Packet ได้ โดย R1 ใช้ Area 0 ส่วน Network Statement ของ R2 ใช้ Area 1', checklists: ['ใช้ show ip ospf neighbor เพื่อตรวจสอบ Neighbor Table', 'ตรวจสอบ OSPF ของ Interface ด้วย show ip ospf interface gigabitethernet 0/0/1', 'ตรวจสอบส่วน router ospf ใน running-config ของ Router ทั้งสองตัว', 'แก้ Network Statement ของ R2 ให้ใช้ Area 0'] },
  10: { title: 'ภารกิจ 10 — DHCP Pool เต็มและ Relay ขัดข้อง', description: 'Laptop ที่เชื่อมต่อ Wi-Fi ได้ APIPA 169.254.x.x เพราะไม่มี DHCP Helper Address บน Sub-interface', difficulty: 'ยาก', category: 'การแก้ไขปัญหา', stage_name: 'การแก้ไขปัญหาและความปลอดภัย', estimated_time: '30 นาที', department: 'สำนักงานใหญ่', reported_time: 'วันนี้ 10:15 น.', priority: 'วิกฤต', scenario_text: 'พนักงานไม่สามารถรับ Dynamic IPv4 บน Wireless VLAN 50 ได้ โดย Laptop แสดง APIPA 169.254.x.x ส่วน Windows DHCP Server อยู่บน VLAN 100', checklists: ['ตรวจสอบ IP ของ Mobile Client ด้วย ipconfig เพื่อยืนยัน APIPA 169.254.x.x', 'ตรวจสอบค่า Sub-interface Gig0/0.50 ของ Router', 'ยืนยันว่า Router ไม่ส่งต่อ Broadcast UDP Port 67/68 หากไม่มี Relay Agent', 'เพิ่ม ip helper-address 10.100.1.10 ที่ Interface Gig0/0.50'] },
  11: { title: 'ภารกิจ 11 — DNS ภายในไม่สามารถแปลงชื่อ Domain', description: 'เครื่องผู้ใช้ ping ไปยัง Internet ด้วย IP ได้ แต่ Browser ไม่สามารถแปลงชื่อ Domain ภายในบริษัท', difficulty: 'ปานกลาง', category: 'การแก้ไขปัญหา', stage_name: 'การแก้ไขปัญหาและความปลอดภัย', estimated_time: '20 นาที', department: 'ฝ่ายขายสำนักงานใหญ่', reported_time: 'วันนี้ 11:50 น.', priority: 'สูง', scenario_text: 'ฝ่ายขายเข้าถึง IP สาธารณะอย่าง 8.8.8.8 ได้ แต่เมื่อเปิด portal.corp.local พบ DNS_PROBE_FINISHED_NXDOMAIN เพราะเครื่องถูกกำหนด Public DNS 8.8.8.8 แทน DNS ภายใน 192.168.10.53', checklists: ['ทดสอบ ping 8.8.8.8 จาก Sales Laptop', 'ทดสอบ nslookup portal.corp.local 8.8.8.8 และตรวจสอบ NXDOMAIN', 'ทดสอบ nslookup portal.corp.local 192.168.10.53', 'แก้ Primary IPv4 DNS Server เป็น 192.168.10.53'] },
  12: { title: 'ภารกิจ 12 — วิกฤตเครือข่ายองค์กร', description: 'เหตุขัดข้องหลาย Layer ซึ่งรวมถึง Gateway ผิด ACL ปิดกั้น ICMP/HTTP และ Native VLAN ไม่ตรงกัน', difficulty: 'ยาก', category: 'ความปลอดภัย', stage_name: 'การแก้ไขปัญหาและความปลอดภัย', estimated_time: '35 นาที', department: 'ฝ่ายบริหารและ Data Center', reported_time: 'วันนี้ 16:30 น.', priority: 'วิกฤต', scenario_text: 'การเปลี่ยนแปลงเครือข่ายระหว่างตรวจสอบความปลอดภัยเกิดข้อผิดพลาด ทำให้เครื่องฝ่ายบริหารเข้า Secure Core Vault ไม่ได้ พบปัญหาพร้อมกันสามจุด ได้แก่ ACL ขาออกปิดกั้น TCP Port 443, Native VLAN บน Trunk ไม่ตรงกัน และ Default Gateway ของ Disaster Recovery Server ผิด', checklists: ['วิเคราะห์ข้อความ CDP Error เรื่อง Native VLAN บน Core Switch 01', 'กำหนด Native VLAN บน Trunk ให้ตรงกันด้วย switchport trunk native vlan 99', 'ตรวจสอบ ACL 101 บน Perimeter Firewall และอนุญาต HTTPS ด้วย permit tcp any any eq 443', 'แก้ Default Gateway ของ Core Vault เป็น 10.50.0.1', 'ทดสอบ HTTPS จาก Executive Terminal ไปยัง Core Vault'] },
};

export function localizeMission(mission: Mission, language: Language): Mission {
  if (language !== 'th' || !missionThai[mission.id]) return mission;
  const th = missionThai[mission.id];
  const replacements: Array<[string, string]> = [
    ['Accounting & Payroll', 'ฝ่ายบัญชีและเงินเดือน'], ['Software Engineering', 'ฝ่ายพัฒนาซอฟต์แวร์'],
    ['Marketing & Design', 'ฝ่ายการตลาดและออกแบบ'], ['Branch Office North', 'สำนักงานสาขาภาคเหนือ'],
    ['Infrastructure Core', 'โครงสร้างพื้นฐานส่วนกลาง'], ['Corporate Headquarters', 'สำนักงานใหญ่'],
    ['Corporate Sales', 'ฝ่ายขายสำนักงานใหญ่'], ['Executive Operations', 'ฝ่ายบริหาร'],
    ['Accounting', 'ฝ่ายบัญชี'], ['Marketing', 'ฝ่ายการตลาด'], ['Engineering', 'ฝ่ายวิศวกรรม'],
    ['Finance', 'ฝ่ายการเงิน'], ['Payroll', 'เงินเดือน'], ['Sales', 'ฝ่ายขาย'], ['Developer', 'นักพัฒนา'], ['HR', 'ฝ่ายบุคคล'],
    ['Contractor PC', 'เครื่องผู้รับเหมา'], ['Lab Workstation', 'เครื่องในห้องปฏิบัติการ'],
    ['Marketing PC', 'เครื่องฝ่ายการตลาด'], ['Mobile Client', 'เครื่องผู้ใช้แบบพกพา'],
    ['Executive Terminal', 'เครื่องฝ่ายบริหาร'], ['Branch Client', 'เครื่องผู้ใช้ที่สาขา'],
    ['Ops Station', 'เครื่องฝ่ายปฏิบัติการ'], ['Ops Controller', 'ระบบควบคุมฝ่ายปฏิบัติการ'],
    ['Wrong Subnet', 'Subnet ผิด'], ['Wrong Mask', 'Mask ผิด'], ['Invalid Gateway', 'Gateway ผิด'],
    ['Missing Static Route', 'ไม่มี Static Route'], ['Missing Fa0/8', 'ไม่พบ Fa0/8'],
    ['No carrier signal on', 'ไม่พบสัญญาณที่'], ['administratively down', 'ถูกปิดโดยผู้ดูแล'],
    ['Configured on 192.168.1.0/24 instead of 192.168.10.0/24', 'กำหนดเป็น 192.168.1.0/24 แทน 192.168.10.0/24'],
    ['Subnet boundaries: .0-.63 vs .64-.127', 'ขอบเขต Subnet: .0-.63 และ .64-.127'],
    ['Default Gateway set to 192.168.1.1 instead of 192.168.10.1', 'กำหนด Default Gateway เป็น 192.168.1.1 แทน 192.168.10.1'],
    ['Port Fa0/8 is in VLAN 1 instead of VLAN 30', 'พอร์ต Fa0/8 อยู่ VLAN 1 แทน VLAN 30'],
    ['VLAN 40 dropped across trunk', 'VLAN 40 ถูกทิ้งเมื่อผ่าน Trunk'],
    ['No route to 172.16.0.0', 'ไม่มี Route ไปยัง 172.16.0.0'],
    ['Missing ip helper-address 10.100.1.10 on subinterface', 'ไม่มี ip helper-address 10.100.1.10 บน Sub-interface'],
    ['DNS set to public resolver which has no knowledge of .corp.local', 'กำหนด Public DNS ซึ่งไม่รู้จัก .corp.local'],
    ['ACL blocking secure HTTPS traffic', 'ACL ปิดกั้น HTTPS Traffic'],
    ['Native VLAN mismatch with Access Switch', 'Native VLAN ไม่ตรงกับ Access Switch'],
    ['Default Gateway points to decommissioned IP', 'Default Gateway ชี้ไปยัง IP ที่ยกเลิกใช้งานแล้ว'],
    ['Subnet Misalignment', 'Subnet ไม่ตรงกัน'], ['DHCP Discover Dropped', 'DHCP Discover ถูกทิ้ง'],
    ['DNS Query Mismatch', 'DNS Query ไม่ตรงกัน'], ['Gateway Broken', 'Gateway ขัดข้อง'],
    ['Line Down', 'สายสัญญาณไม่ทำงาน'], ['Admin Down', 'ถูกปิดโดยผู้ดูแล'],
    ['MISMATCH', 'ไม่ตรงกัน'], ['MISMAPPED', 'กำหนดผิด'], ['DROPPED', 'ถูกทิ้ง'],
    ['Misassigned', 'กำหนดผิด'], ['Adjacency Dead', 'Adjacency ขัดข้อง'], ['Public resolver', 'Public DNS'],
  ];
  const translateTopologyText = (value: string) => replacements.reduce((text, [from, to]) => text.replaceAll(from, to), value);
  const topology = mission.topology ? {
    ...mission.topology,
    nodes: mission.topology.nodes.map(node => ({ ...node, name: translateTopologyText(node.name), issue: node.issue ? translateTopologyText(node.issue) : node.issue })),
    links: mission.topology.links.map(link => ({ ...link, label: link.label ? translateTopologyText(link.label) : link.label })),
  } : mission.topology;
  return { ...mission, ...th, topology, checklists_json: JSON.stringify(th.checklists), checklists: th.checklists } as Mission;
}

type QuestionThai = Pick<Question, 'question' | 'option_a' | 'option_b' | 'option_c' | 'option_d' | 'root_cause' | 'explanation'>;
const questionThai: Record<number, QuestionThai> = {
  1: { question: 'สาเหตุหลักที่ทำให้ PC-01 ไม่สามารถสื่อสารผ่านเครือข่ายได้คืออะไร?', option_a: 'กำหนด Subnet Mask บน PC-01 ผิด', option_b: 'สาย Ethernet หลุดหรือเชื่อมต่อไม่สมบูรณ์', option_c: 'เกิด DHCP Starvation Attack บน SW1', option_d: 'DNS Forwarder บน Core Router หมดเวลา', root_cause: 'การเชื่อมต่อขาดที่ OSI Layer 1', explanation: 'พอร์ต Fa0/1 แสดงว่า Line Protocol เป็น down และไม่พบสัญญาณ เมื่อตรวจสอบพบว่าหัว RJ45 หลุดระหว่างการย้ายโต๊ะ' },
  2: { question: 'คำสั่ง Cisco IOS ใดใช้แสดงสถานะของพอร์ตทั้งหมดบน Switch แบบสรุป?', option_a: 'show ip interface brief', option_b: 'show arp detail', option_c: 'show vlan summary', option_d: 'ping 127.0.0.1 -t', root_cause: 'การตรวจสอบสถานะพอร์ต', explanation: 'คำสั่ง show ip interface brief หรือ show interfaces status ช่วยให้ตรวจสอบสถานะ Physical และ Protocol ของทุก Interface ได้อย่างรวดเร็ว' },
  3: { question: 'เหตุใดเครื่องผู้รับเหมาจึงติดต่อ Default Gateway 192.168.10.1 ไม่ได้?', option_a: 'พอร์ต Fa0/3 ถูกสั่ง shutdown', option_b: 'เครื่องถูกกำหนดให้อยู่ 192.168.1.0/24 แทน 192.168.10.0/24', option_c: 'ACL ของ Router ปิดกั้น ICMP Echo Request', option_d: 'DNS Cache ของระบบปฏิบัติการเสียหาย', root_cause: 'IPv4 Network Address และ Subnet ไม่ตรงกัน', explanation: 'เครื่องใช้ 192.168.1.55/24 แต่ Gateway คือ 192.168.10.1 จึงมองว่า Gateway อยู่นอกเครือข่ายและไม่สามารถส่งต่อไปยัง Next Hop ได้' },
  4: { question: 'เมื่อใช้ /26 (255.255.255.192) Network Address และ Broadcast Address ของ Subnet ที่มี 192.168.50.70 คือข้อใด?', option_a: 'Network: 192.168.50.0, Broadcast: 192.168.50.255', option_b: 'Network: 192.168.50.64, Broadcast: 192.168.50.127', option_c: 'Network: 192.168.50.32, Broadcast: 192.168.50.63', option_d: 'Network: 192.168.50.64, Broadcast: 192.168.50.255', root_cause: 'ขอบเขต VLSM /26 แบ่งคนละ Subnet', explanation: '/26 แบ่ง Block ละ 64 Address โดย .0-.63 เป็น Subnet แรก และ .64-.127 เป็น Subnet ที่สอง ดังนั้น .70 จึงอยู่คนละ Subnet กับ Gateway .1 และ Server .10' },
  5: { question: 'อะไรทำให้ PC-01 ติดต่อ Server ใน Data Center ไม่ได้?', option_a: 'Subnet Mask ของ PC-01 ผิด', option_b: 'Default Gateway ของ PC-01 ผิด', option_c: 'พอร์ตบน SW1 ถูกปิด', option_d: 'Authoritative DNS Server ขัดข้อง', root_cause: 'Default Gateway ไม่ถูกต้อง', explanation: 'PC-01 ใช้ Gateway 192.168.1.1 แต่ Gateway ที่ถูกต้องของ 192.168.10.0/24 คือ 192.168.10.1 จึงส่ง Packet ไปต่าง Subnet ไม่ได้' },
  6: { question: 'จากผลลัพธ์ Cisco IOS พอร์ต FastEthernet0/12 อยู่ในสถานะใด?', option_a: 'up / up', option_b: 'administratively down / down', option_c: 'err-disabled / down', option_d: 'down / down (notconnect)', root_cause: 'พอร์ตถูกปิดโดยผู้ดูแล', explanation: 'Interface ถูกปิดด้วยคำสั่ง shutdown ระหว่างการบำรุงรักษา และยังไม่ได้เปิดอีกครั้งด้วย no shutdown' },
  7: { question: 'คำสั่ง Cisco ใดใช้เปิด Interface ที่ถูกปิดโดยผู้ดูแลให้กลับมาใช้งาน?', option_a: 'interface restart', option_b: 'no shutdown', option_c: 'enable port', option_d: 'ip interface up', root_cause: 'การควบคุม Interface บน Cisco IOS', explanation: 'ใน Interface Configuration Mode คำสั่ง no shutdown จะยกเลิกสถานะปิดโดยผู้ดูแลและเปิดการส่งสัญญาณ' },
  8: { question: 'เหตุใด PC-DEV จึงติดต่อ Git Server ไม่ได้ ทั้งที่ทั้งสองมี IP 192.168.30.x?', option_a: 'Fa0/8 ทำงานแบบ Half-Duplex', option_b: 'Fa0/8 อยู่ VLAN 1 แทน VLAN 30 ทำให้แยก Broadcast Domain', option_c: 'Router ไม่มี OSPF Area', option_d: 'VTP Pruning ลบ VLAN 30', root_cause: 'กำหนด VLAN ของพอร์ตผิด', explanation: 'Switch แยก Layer 2 Broadcast Domain ด้วย VLAN พอร์ตใน VLAN 1 จึงส่ง Frame ไปยัง VLAN 30 โดยไม่มี Layer 3 Router ไม่ได้' },
  9: { question: 'คำสั่ง Cisco ใดเพิ่ม VLAN 40 ใน Trunk โดยไม่แทนที่ VLAN ที่อนุญาตเดิม?', option_a: 'switchport trunk allowed vlan 40', option_b: 'switchport trunk allowed vlan add 40', option_c: 'trunk vlan permit 40', option_d: 'vlan 40 trunk forward', root_cause: 'ข้อจำกัดรายการ VLAN ที่อนุญาตบน Trunk', explanation: 'switchport trunk allowed vlan 40 จะแทนที่รายการเดิม ต้องใช้คำว่า add เพื่อคง VLAN 10 และ 20 ไว้' },
  10: { question: 'Router จะทำอย่างไรเมื่อได้รับ Packet ที่ไม่มี Route ตรงกันและไม่มี Default Route?', option_a: 'Broadcast Packet ออกทุก Interface', option_b: 'เก็บ Packet ใน NVRAM จนกว่าจะเรียนรู้ Route', option_c: 'ทิ้ง Packet และส่ง ICMP Destination Unreachable', option_d: 'สร้าง ARP Proxy อัตโนมัติ', root_cause: 'ค้นหาเส้นทางใน Routing Table ไม่สำเร็จ', explanation: 'หากไม่มี Route ที่ตรงกันหรือ Gateway of Last Resort (0.0.0.0/0) Router จะทิ้ง Packet และตอบ ICMP Type 3 Code 0' },
  11: { question: 'ค่าใดต้องตรงกันระหว่าง OSPF Router สองตัวจึงจะสร้าง Full Adjacency ได้?', option_a: 'Router ID และ Hostname', option_b: 'Area ID, Hello/Dead Timer, Subnet Mask และ Authentication', option_c: 'Process ID และ Bandwidth', option_d: 'Priority และ MAC Address', root_cause: 'Area ID ใน OSPF Hello Packet ไม่ตรงกัน', explanation: 'OSPF Hello Packet ตรวจสอบ Area ID, Hello/Dead Interval, MTU, Subnet Mask และ Authentication หาก Area ID ต่างกันจะไม่สร้าง Adjacency' },
  12: { question: 'เหตุใด Router จึงไม่ส่งต่อ DHCP Discover จาก Local Broadcast Domain ตามค่าเริ่มต้น?', option_a: 'DHCP ต้องใช้ TCP Three-Way Handshake', option_b: 'Router ไม่ส่งต่อ IPv4 Broadcast 255.255.255.255 ข้าม Interface ตามค่าเริ่มต้น', option_c: 'DHCP ใช้ Multicast ที่สงวนให้ Routing Protocol', option_d: 'Switch ตัด UDP Header ออก', root_cause: 'การแบ่งขอบเขต Broadcast Domain', explanation: 'DHCP Discover เป็น Broadcast ที่ Layer 2/3 หากต้องส่งไปยัง DHCP Server ต่าง Subnet Router ต้องทำหน้าที่ DHCP Relay Agent ด้วย ip helper-address' },
  13: { question: 'เหตุใด Sales Laptop จึงแปลงชื่อ portal.corp.local ไม่ได้เมื่อสอบถาม 8.8.8.8?', option_a: 'Firewall ปิดกั้น Port 53 ขาออก', option_b: 'Public DNS ไม่มี Record ของ Namespace ภายใน .corp.local', option_c: 'ARP Cache ของ Router หมดอายุ', option_d: 'NAT ปิดกั้น HTTP', root_cause: 'ขอบเขต Split DNS ไม่ตรงกัน', explanation: 'Domain ภายใน .corp.local อยู่บน Authoritative DNS ภายในเท่านั้น Public DNS เช่น 8.8.8.8 จึงไม่รู้จัก Record ภายในตาม RFC 1918' },
  14: { question: 'เมื่อ Native VLAN บน Cisco Switch สองตัวไม่ตรงกันผ่าน 802.1Q Trunk จะพบ CDP Syslog ใด?', option_a: '%SPANTREE-2-BLOCK_BPDUGUARD', option_b: '%CDP-4-NATIVE_VLAN_MISMATCH', option_c: '%OSPF-5-ADJCHANGE', option_d: '%LINK-3-UPDOWN', root_cause: 'Native VLAN ของ 802.1Q ไม่ตรงกันและเกิด Spanning Tree Inconsistency', explanation: 'CDP ตรวจสอบการกำหนด Trunk หาก Switch หนึ่งใช้ VLAN 99 กับ Untagged Traffic แต่อีกตัวใช้ VLAN 1 จะรายงาน %CDP-4-NATIVE_VLAN_MISMATCH' },
  15: { question: 'ใน Cisco Extended ACL ควรวาง established หรือ permit tcp any any eq 443 ไว้ตำแหน่งใดเมื่อเทียบกับ deny ip any any?', option_a: 'หลังคำสั่ง deny', option_b: 'ก่อน Explicit หรือ Implicit Deny เพราะ ACL ตรวจจากบนลงล่างและหยุดเมื่อพบเงื่อนไขแรก', option_c: 'ท้ายไฟล์ ACL', option_d: 'ลำดับไม่มีผลใน Cisco ACL', root_cause: 'ลำดับการประมวลผล ACL จากบนลงล่าง', explanation: 'Cisco ACL ตรวจ Statement จากบนลงล่างจนพบรายการที่ตรงกัน หาก deny อยู่ก่อน permit Traffic ที่ตรงกับทั้งสองจะถูกทิ้งทันที' },
};

export function localizeQuestion(question: Question, language: Language): Question {
  return language === 'th' && questionThai[question.id] ? { ...question, ...questionThai[question.id] } : question;
}

const hintThai = [
  'ตรวจสอบไฟสถานะบน Switch SW1 โดยพอร์ต Fa0/1 อยู่ในสถานะ down/down', 'ปัญหานี้เกิดที่ OSI Layer 1 ก่อนกระบวนการ IP หรือ Routing', 'ใน Packet Tracer ให้ต่อสาย Copper Straight-Through ระหว่าง PC-01 FastEthernet0 กับ Switch Fa0/1 ใหม่',
  'ใช้ ipconfig บนเครื่องผู้รับเหมาแล้วตรวจสอบ Octet ที่ 3', 'Interface ของ Router ใช้ 192.168.10.1 255.255.255.0', 'เปลี่ยน IP ของเครื่องเป็น 192.168.10.55 และ Subnet Mask 255.255.255.0',
  '255.255.255.192 ยืม Host Bit 2 Bit จึงมีขนาด Block เท่ากับ 256 - 192 = 64', '192.168.50.10 อยู่ช่วง .1-.62 แต่ .70 อยู่ช่วง .65-.126', 'เปลี่ยน Subnet Mask ของ PC-03 เป็น 255.255.255.0 เพื่อกลับเข้า /24',
  'PC-01 ping ไป PC-02 ได้ แต่ ping ไปยัง 10.0.0.x ไม่ได้', 'ตรวจสอบ Default Gateway บน PC-01 ด้วย ipconfig', 'เปลี่ยน Default Gateway จาก 192.168.1.1 เป็น 192.168.10.1',
  'เปิด CLI ของ SW-B2 แล้วใช้ show ip interface brief', 'Fa0/12 แสดงสถานะ administratively down', 'ใช้ config t ตามด้วย interface fa0/12, no shutdown และ end',
  'ใช้ show vlan brief บน Switch', 'ค้นหาพอร์ต Fa0/8 และตรวจสอบ VLAN ID ที่กำหนด', 'ใช้ switchport access vlan 30 ที่ Interface FastEthernet0/8',
  'ใช้ show interfaces trunk บน SW1', 'ตรวจสอบบรรทัด Vlans allowed on trunk ของ Gig0/1', 'ใช้ switchport trunk allowed vlan add 40 ที่ Gig0/1 ของ SW1',
  'ใช้ show ip route บน R-Branch และสังเกตว่าไม่มี 172.16.0.0', 'Next Hop ผ่าน Serial WAN คือ 10.254.1.1', 'ใช้ ip route 172.16.0.0 255.255.0.0 10.254.1.1 บน R-Branch',
  'ใช้ show ip ospf interface บน R1 และ R2 ที่ Gig0/0/1', 'ตรวจสอบค่า Area ของทั้งสองฝั่ง', 'บน R2 เปลี่ยน Network Statement จาก area 1 เป็น area 0',
  'IP 169.254.x.x หมายถึงการขอ DHCP ไม่สำเร็จ', 'DHCP Server อยู่ที่ 10.100.1.10 บน Subnet 10.100.1.0/24', 'กำหนด ip helper-address 10.100.1.10 บน Gig0/0.50',
  'ใช้ nslookup portal.corp.local บนเครื่องผู้ใช้', 'ตรวจสอบว่า DNS Server ที่ตอบคือ 192.168.10.53 หรือไม่', 'เปลี่ยน Preferred DNS Server เป็น 192.168.10.53',
  'ตรวจสอบ CDP Syslog บน Core Switch 01', 'ตรวจสอบ ACL ขาออกบน Gig0/0 ของ Perimeter Firewall', 'แก้ Native VLAN บน SW02, อนุญาต tcp eq 443 ใน ACL 101 และแก้ Gateway ของ Core Vault เป็น 10.50.0.1',
];

export function localizeHint(hint: Hint, language: Language): Hint {
  return language === 'th' && hintThai[hint.id - 1] ? { ...hint, hint_text: hintThai[hint.id - 1] } : hint;
}

const achievementThai: Record<string, Pick<Achievement, 'name' | 'description' | 'category'>> = {
  first_connection: { name: 'การเชื่อมต่อครั้งแรก', description: 'ทำภารกิจวิศวกรรมเครือข่ายแรกให้สำเร็จ', category: 'ความก้าวหน้า' },
  troubleshooter: { name: 'ผู้เชี่ยวชาญการแก้ปัญหา', description: 'ทำภารกิจแก้ไขปัญหาให้สำเร็จ 5 ภารกิจ', category: 'การแก้ไขปัญหา' },
  routing_rookie: { name: 'ก้าวแรกด้าน Routing', description: 'ทำภารกิจ IP Routing แรกให้สำเร็จ', category: 'Routing' },
  vlan_master: { name: 'ผู้เชี่ยวชาญ VLAN', description: 'แก้โจทย์ VLAN และ Trunk ทั้งหมดให้สำเร็จ', category: 'Switching' },
  no_hints: { name: 'สัญชาตญาณล้วน', description: 'ทำภารกิจให้สำเร็จโดยไม่เปิดคำใบ้', category: 'ความเป็นเลิศ' },
  perfect_engineer: { name: 'วิศวกรสมบูรณ์แบบ', description: 'ทำ 3 ภารกิจโดยได้รับ XP สูงสุด 100%', category: 'ความเป็นเลิศ' },
  subnet_samurai: { name: 'ซามูไร Subnet', description: 'แก้โจทย์ IP Addressing และ VLSM Subnetting ถูกในครั้งแรก', category: 'การกำหนด IP' },
  packet_tracer_pro: { name: 'มืออาชีพ Packet Tracer', description: 'ดาวน์โหลดและตรวจสอบแล็บ Cisco Packet Tracer 3 รายการ', category: 'ห้องปฏิบัติการ' },
};

export function localizeAchievement(achievement: Achievement, language: Language): Achievement {
  return language === 'th' && achievementThai[achievement.slug] ? { ...achievement, ...achievementThai[achievement.slug] } : achievement;
}

const assessmentThai: Record<number, Pick<AssessmentQuestion, 'category' | 'question' | 'option_a' | 'option_b' | 'option_c' | 'option_d'>> = {
  1: { category: 'การกำหนด IP', question: 'ข้อใดเป็น Usable Host IPv4 ที่ถูกต้องภายใน Subnet 192.168.1.64/26?', option_a: '192.168.1.64', option_b: '192.168.1.100', option_c: '192.168.1.127', option_d: '192.168.1.128' },
  2: { category: 'การแบ่ง Subnet', question: 'Subnet Mask /29 (255.255.255.248) รองรับ Usable Host IP ได้กี่ Address?', option_a: '2', option_b: '6', option_c: '8', option_d: '14' },
  3: { category: 'VLAN', question: 'จุดประสงค์หลักของ 802.1Q Trunk Port ระหว่าง Switch สองตัวคืออะไร?', option_a: 'รวม Bandwidth เป็น EtherChannel', option_b: 'ส่ง Traffic หลาย VLAN ผ่าน Physical Link เดียวด้วย VLAN Tag ขนาด 4 Byte', option_c: 'กำหนด Static IP ให้เครื่องผู้ใช้', option_d: 'เข้ารหัส Layer 2 Frame ด้วย AES-256' },
  4: { category: 'Default Gateway', question: 'เมื่อเครื่อง 10.0.1.50/24 ส่ง Packet ไปยัง Server 172.16.5.10 จะใส่ Destination MAC ใดใน Ethernet Frame?', option_a: 'MAC Address ของ Server', option_b: 'Broadcast MAC Address', option_c: 'MAC Address ของ Default Gateway', option_d: 'เลขศูนย์ทั้งหมด' },
  5: { category: 'Routing', question: 'Routing Protocol ใดคำนวณ Metric โดยอ้างอิง Bandwidth สะสมของเส้นทางเป็นหลัก?', option_a: 'RIP (Hop Count)', option_b: 'OSPF (Cost = 10^8 / Bandwidth)', option_c: 'BGP (AS Path)', option_d: 'STP (Root Path Priority)' },
  6: { category: 'การแก้ไขปัญหา', question: 'ผู้ใช้ ping เครื่องในห้องเดียวกันได้ แต่เข้า Google หรือ Intranet อาคารอื่นไม่ได้ สาเหตุที่เป็นไปได้มากที่สุดคืออะไร?', option_a: 'สาย Ethernet เสีย', option_b: 'ไม่มีหรือกำหนด Default Gateway ผิด', option_c: 'Duplex ระหว่าง PC กับ Switch ไม่ตรงกัน', option_d: 'Switch ของชั้นไม่มีไฟฟ้า' },
  7: { category: 'Switching', question: 'คำสั่ง Cisco ใดแสดงว่า Interface อยู่ใน Access หรือ Trunk Mode รวมถึง VLAN และสถานะ Tagging?', option_a: 'show ip arp', option_b: 'show mac address-table', option_c: 'show interfaces <interface_id> switchport', option_d: 'show spanning-tree brief' },
  8: { category: 'ความปลอดภัยเครือข่าย', question: 'ค่าเริ่มต้นที่ท้าย Cisco ACL ทุกชุดคืออะไร?', option_a: 'Implicit permit ip any any', option_b: 'Implicit deny ip any any', option_c: 'บันทึก Packet ที่ไม่ตรงเงื่อนไขทั้งหมดลง Syslog', option_d: 'ส่งต่อไปยัง Default Gateway' },
};

export function localizeAssessmentQuestion(question: AssessmentQuestion, language: Language): AssessmentQuestion {
  return language === 'th' && assessmentThai[question.id] ? { ...question, ...assessmentThai[question.id] } : question;
}

const thaiCategoryLabels: Record<string, string> = {
  Fundamental: 'พื้นฐานเครือข่าย',
  'Network Fundamentals': 'พื้นฐานเครือข่าย',
  'IP Addressing': 'การกำหนด IP',
  Subnetting: 'การแบ่ง Subnet',
  Switching: 'Switching',
  VLAN: 'VLAN',
  'Default Gateway': 'Default Gateway',
  Routing: 'Routing',
  Troubleshooting: 'การแก้ไขปัญหา',
  Security: 'ความปลอดภัย',
  'Network Security': 'ความปลอดภัยเครือข่าย',
};

export function localizeCategoryLabel(category: string, language: Language): string {
  return language === 'th' ? (thaiCategoryLabels[category] || category) : category;
}
