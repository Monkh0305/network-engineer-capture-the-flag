import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

// Database file path
const DB_FILE = path.resolve(process.cwd(), 'network_ctf.db');
export const db = new DatabaseSync(DB_FILE);

export function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      xp_reward INTEGER NOT NULL,
      category TEXT NOT NULL,
      stage INTEGER NOT NULL,
      stage_name TEXT NOT NULL,
      estimated_time TEXT NOT NULL,
      packet_tracer_file TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      incident_id TEXT NOT NULL,
      department TEXT NOT NULL,
      reported_time TEXT NOT NULL,
      priority TEXT NOT NULL,
      scenario_text TEXT NOT NULL,
      target_flag TEXT NOT NULL,
      topology_json TEXT NOT NULL,
      checklists_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mission_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id INTEGER NOT NULL,
      task_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      root_cause TEXT NOT NULL,
      explanation TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id INTEGER NOT NULL,
      hint_order INTEGER NOT NULL,
      hint_text TEXT NOT NULL,
      xp_penalty INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      mission_id INTEGER NOT NULL,
      status TEXT NOT NULL, -- 'locked', 'unlocked', 'in_progress', 'completed'
      score INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      completed_at TEXT,
      UNIQUE(user_id, mission_id)
    );

    CREATE TABLE IF NOT EXISTS user_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      UNIQUE(user_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS user_hints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      hint_id INTEGER NOT NULL,
      used_at TEXT NOT NULL,
      UNIQUE(user_id, hint_id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      unlocked_at TEXT NOT NULL,
      UNIQUE(user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS assessment_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessment_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      assessment_type TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      completed_at TEXT NOT NULL
    );
  `);

  // Seed default missions if empty
  const missionCount = db.prepare('SELECT COUNT(*) as count FROM missions').get() as { count: number };
  if (missionCount.count === 0) {
    seedMissions();
  }

  // Seed achievements if empty
  const achievementCount = db.prepare('SELECT COUNT(*) as count FROM achievements').get() as { count: number };
  if (achievementCount.count === 0) {
    seedAchievements();
  }

  // Seed assessment questions if empty
  const assessmentCount = db.prepare('SELECT COUNT(*) as count FROM assessment_questions').get() as { count: number };
  if (assessmentCount.count === 0) {
    seedAssessmentQuestions();
  }

  // Seed default student user if not exists
  const defaultUser = db.prepare('SELECT id FROM users WHERE username = ?').get('cadet_networker');
  if (!defaultUser) {
    seedDefaultUser();
  }
}

function seedMissions() {
  const missionsData = [
    {
      title: 'Mission 01 — Disconnected Physical Link',
      description: 'A workstation in Accounting has lost all access to the local switch after office desks were moved.',
      difficulty: 'Easy',
      xp_reward: 100,
      category: 'Fundamental',
      stage: 1,
      stage_name: 'Network Fundamentals',
      estimated_time: '15 min',
      packet_tracer_file: 'mission01_disconnected_cable.pka',
      order_index: 1,
      incident_id: 'INC-2041',
      department: 'Accounting & Payroll',
      reported_time: 'Today 09:15 AM',
      priority: 'High',
      scenario_text: 'Users from Accounting report that PC-01 has a red link status light. Employees cannot ping the default gateway or access any local services. The physical cabling was altered during office furniture rearrangement.',
      target_flag: 'FLAG{LAYER_1_PHYSICAL_LINK_RESTORED}',
      topology: JSON.stringify({
        nodes: [
          { id: 'internet', name: 'ISP Gateway', type: 'cloud', ip: '203.0.113.1', status: 'online', x: 50, y: 15 },
          { id: 'r1', name: 'Core Router (R1)', type: 'router', ip: '192.168.1.1', status: 'online', x: 50, y: 35 },
          { id: 'sw1', name: 'Switch-Floor1 (SW1)', type: 'switch', ip: '192.168.1.2', status: 'online', x: 50, y: 58 },
          { id: 'pc1', name: 'PC-01 (Accounting)', type: 'pc', ip: '192.168.1.10', status: 'error', x: 25, y: 82, issue: 'No carrier signal on FastEthernet 0/1' },
          { id: 'pc2', name: 'PC-02 (HR)', type: 'pc', ip: '192.168.1.11', status: 'online', x: 50, y: 82 },
          { id: 'server', name: 'ERP File Server', type: 'server', ip: '192.168.1.200', status: 'online', x: 75, y: 82 }
        ],
        links: [
          { from: 'internet', to: 'r1', status: 'normal', label: 'Gig0/0' },
          { from: 'r1', to: 'sw1', status: 'normal', label: 'Gig0/1' },
          { from: 'sw1', to: 'pc1', status: 'down', label: 'Fa0/1 (Line Down)' },
          { from: 'sw1', to: 'pc2', status: 'normal', label: 'Fa0/2' },
          { from: 'sw1', to: 'server', status: 'normal', label: 'Fa0/24' }
        ]
      }),
      checklists: JSON.stringify([
        'Inspect physical NIC link LEDs on PC-01',
        'Verify cable connection between PC-01 and switch port FastEthernet0/1',
        'Run CLI: show interfaces fastethernet 0/1 to check line protocol and carrier status',
        'Check patch panel port labeling against the switch rack'
      ]),
      questions: [
        {
          question: 'What is the primary cause of PC-01 losing all network communication?',
          option_a: 'Subnet mask misconfiguration on PC-01',
          option_b: 'Physical link disconnection or unseated Ethernet patch cable',
          option_c: 'DHCP starvation attack on SW1',
          option_d: 'DNS forwarder timeout on the Core Router',
          correct_answer: 'B',
          root_cause: 'Physical Layer (OSI Layer 1) Disconnection',
          explanation: 'The switch port Fa0/1 reports "line protocol is down, carrier not detected". Inspection reveals the RJ45 modular jack was disconnected during desk relocation.'
        },
        {
          question: 'Which Cisco IOS command displays the operational status of all switch ports in summary?',
          option_a: 'show ip interface brief',
          option_b: 'show arp detail',
          option_c: 'show vlan summary',
          option_d: 'ping 127.0.0.1 -t',
          correct_answer: 'A',
          root_cause: 'Port Status Verification',
          explanation: '"show ip interface brief" or "show interfaces status" allows a network engineer to quickly view physical and protocol state across all interfaces.'
        }
      ],
      hints: [
        { order: 1, text: 'Look closely at the link indicators on Switch SW1. Notice port Fa0/1 is in a down/down state.', penalty: 10 },
        { order: 2, text: 'This problem occurs strictly at OSI Layer 1 before any IP addressing or routing takes place.', penalty: 20 },
        { order: 3, text: 'In Packet Tracer, reconnect the straight-through copper cable between PC-01 FastEthernet0 and Switch Fa0/1.', penalty: 30 }
      ]
    },
    {
      title: 'Mission 02 — Subnet Mismatch & Rogue IP',
      description: 'A contractor statically set their laptop IP address into an incorrect network range, preventing default gateway ARP.',
      difficulty: 'Easy',
      xp_reward: 120,
      category: 'IP Addressing',
      stage: 1,
      stage_name: 'Network Fundamentals',
      estimated_time: '18 min',
      packet_tracer_file: 'mission02_wrong_ip.pka',
      order_index: 2,
      incident_id: 'INC-2042',
      department: 'Engineering Lab',
      reported_time: 'Today 10:30 AM',
      priority: 'Medium',
      scenario_text: 'A visiting network technician cannot reach the lab file repository. The workstation link light is green, but pinging the gateway 192.168.10.1 returns Destination Host Unreachable.',
      target_flag: 'FLAG{IP_SUBNET_REALIGNED_192_168_10_X}',
      topology: JSON.stringify({
        nodes: [
          { id: 'r1', name: 'Gateway R1', type: 'router', ip: '192.168.10.1/24', status: 'online', x: 50, y: 20 },
          { id: 'sw1', name: 'Lab Switch', type: 'switch', ip: '192.168.10.2/24', status: 'online', x: 50, y: 50 },
          { id: 'pc1', name: 'Contractor PC', type: 'pc', ip: '192.168.1.55/24 (Wrong Subnet)', status: 'error', x: 30, y: 80, issue: 'Configured on 192.168.1.0/24 instead of 192.168.10.0/24' },
          { id: 'pc2', name: 'Lab Workstation', type: 'pc', ip: '192.168.10.15/24', status: 'online', x: 70, y: 80 }
        ],
        links: [
          { from: 'r1', to: 'sw1', status: 'normal', label: 'Gig0/0 (192.168.10.1)' },
          { from: 'sw1', to: 'pc1', status: 'warning', label: 'Fa0/3 (Subnet Misalignment)' },
          { from: 'sw1', to: 'pc2', status: 'normal', label: 'Fa0/4' }
        ]
      }),
      checklists: [
        'Check IP configuration on Contractor PC using ipconfig /all',
        'Compare Contractor PC subnet with Gateway interface Gig0/0 IP on R1',
        'Determine why ARP request for 192.168.10.1 cannot be handled locally',
        'Reconfigure static IPv4 address within 192.168.10.0/24 scope'
      ],
      questions: [
        {
          question: 'Why was Contractor PC unable to communicate with Default Gateway 192.168.10.1?',
          option_a: 'Switch port Fa0/3 was shut down administratively',
          option_b: 'The PC was configured on 192.168.1.0/24 instead of 192.168.10.0/24',
          option_c: 'The router access-list dropped ICMP echo requests',
          option_d: 'DNS cache was corrupted on the operating system',
          correct_answer: 'B',
          root_cause: 'IPv4 Network Address Subnet Mismatch',
          explanation: 'Because the PC was assigned 192.168.1.55/24 with gateway 192.168.10.1, the PC considered the gateway to be on an off-link network and attempted to route via an unreachable next-hop.'
        }
      ],
      hints: [
        { order: 1, text: 'Run "ipconfig" in the command prompt of Contractor PC and inspect the 3rd octet.', penalty: 10 },
        { order: 2, text: 'The router interface is configured as 192.168.10.1 255.255.255.0.', penalty: 20 },
        { order: 3, text: 'Change the Contractor PC IP address to 192.168.10.55 with subnet mask 255.255.255.0.', penalty: 30 }
      ]
    },
    {
      title: 'Mission 03 — Incorrect Subnet Mask Isolation',
      description: 'Accounting PCs cannot reach the payroll server because a /26 mask isolates addresses in the same classful block.',
      difficulty: 'Easy',
      xp_reward: 130,
      category: 'Subnetting',
      stage: 1,
      stage_name: 'Network Fundamentals',
      estimated_time: '20 min',
      packet_tracer_file: 'mission03_incorrect_mask.pka',
      order_index: 3,
      incident_id: 'INC-2043',
      department: 'Finance',
      reported_time: 'Today 11:45 AM',
      priority: 'High',
      scenario_text: 'Finance workstation PC-03 (192.168.50.70) cannot reach server SRV-01 (192.168.50.10). The technician believed both were on the same subnet, but PC-03 was configured with a 255.255.255.192 (/26) subnet mask.',
      target_flag: 'FLAG{SUBNET_MASK_CALCULATED_255_255_255_0}',
      topology: JSON.stringify({
        nodes: [
          { id: 'r1', name: 'Finance Router', type: 'router', ip: '192.168.50.1/24', status: 'online', x: 50, y: 25 },
          { id: 'sw1', name: 'Finance SW', type: 'switch', ip: '192.168.50.2/24', status: 'online', x: 50, y: 55 },
          { id: 'pc3', name: 'PC-03 (Finance)', type: 'pc', ip: '192.168.50.70/26 (Wrong Mask)', status: 'error', x: 25, y: 85, issue: 'Subnet boundaries: .0-.63 vs .64-.127' },
          { id: 'srv1', name: 'SRV-01 (Payroll)', type: 'server', ip: '192.168.50.10/24', status: 'online', x: 75, y: 85 }
        ],
        links: [
          { from: 'r1', to: 'sw1', status: 'normal', label: 'Gig0/0' },
          { from: 'sw1', to: 'pc3', status: 'warning', label: 'Fa0/3 (Mask /26)' },
          { from: 'sw1', to: 'srv1', status: 'normal', label: 'Fa0/10 (Mask /24)' }
        ]
      }),
      checklists: [
        'Calculate network block size for 255.255.255.192 (/26)',
        'Identify which /26 subnets 192.168.50.10 and 192.168.50.70 fall into',
        'Observe how PC-03 treats 192.168.50.10 as remote rather than local',
        'Standardize subnet mask on PC-03 to match network design 255.255.255.0'
      ],
      questions: [
        {
          question: 'With a /26 mask (255.255.255.192), what are the network and broadcast addresses for the subnet containing 192.168.50.70?',
          option_a: 'Network: 192.168.50.0, Broadcast: 192.168.50.255',
          option_b: 'Network: 192.168.50.64, Broadcast: 192.168.50.127',
          option_c: 'Network: 192.168.50.32, Broadcast: 192.168.50.63',
          option_d: 'Network: 192.168.50.64, Broadcast: 192.168.50.255',
          correct_answer: 'B',
          root_cause: 'VLSM /26 Subnet Boundary Split',
          explanation: 'A /26 creates blocks of 64. Subnet 1 is .0-.63, Subnet 2 is .64-.127. Host .70 is in the second subnet while the gateway .1 and server .10 are in the first subnet.'
        }
      ],
      hints: [
        { order: 1, text: 'In binary, 255.255.255.192 has 2 host bits borrowed: block increment is 256 - 192 = 64.', penalty: 10 },
        { order: 2, text: 'Host 192.168.50.10 is in range 192.168.50.1-62, but host .70 is in range 192.168.50.65-126.', penalty: 20 },
        { order: 3, text: 'Update the subnet mask on PC-03 to 255.255.255.0 to rejoin the /24 network.', penalty: 30 }
      ]
    },
    {
      title: 'Mission 04 — The Missing Default Gateway',
      description: 'Accounting users report they cannot reach external branches or the cloud portal. Internal intranet ping works fine.',
      difficulty: 'Easy',
      xp_reward: 150,
      category: 'Default Gateway',
      stage: 2,
      stage_name: 'Switching & Gateway',
      estimated_time: '20 min',
      packet_tracer_file: 'mission04_gateway_issue.pka',
      order_index: 4,
      incident_id: 'INC-2044',
      department: 'Accounting',
      reported_time: 'Today 01:15 PM',
      priority: 'High',
      scenario_text: 'Users from the Accounting department report that they cannot access the company server located in the remote Data Center subnet (10.0.0.50). Other departments can access the server normally. Local communication to nearby PCs on 192.168.10.0/24 works.',
      target_flag: 'FLAG{INCORRECT_DEFAULT_GATEWAY_FIXED}',
      topology: JSON.stringify({
        nodes: [
          { id: 'dc_srv', name: 'Data Center Server', type: 'server', ip: '10.0.0.50/24', status: 'online', x: 50, y: 10 },
          { id: 'r1', name: 'Edge Router R1', type: 'router', ip: 'Gig0/0: 10.0.0.1 | Gig0/1: 192.168.10.1', status: 'online', x: 50, y: 35 },
          { id: 'sw1', name: 'Access Switch SW1', type: 'switch', ip: '192.168.10.2', status: 'online', x: 50, y: 60 },
          { id: 'pc1', name: 'PC-01 (Accounting)', type: 'pc', ip: '192.168.10.12 (GW: 192.168.1.1 ❌)', status: 'error', x: 30, y: 85, issue: 'Default Gateway set to 192.168.1.1 instead of 192.168.10.1' },
          { id: 'pc2', name: 'PC-02 (Sales)', type: 'pc', ip: '192.168.10.15 (GW: 192.168.10.1 ✔️)', status: 'online', x: 70, y: 85 }
        ],
        links: [
          { from: 'dc_srv', to: 'r1', status: 'normal', label: '10.0.0.0/24 WAN' },
          { from: 'r1', to: 'sw1', status: 'normal', label: '192.168.10.1 (Gig0/1)' },
          { from: 'sw1', to: 'pc1', status: 'warning', label: 'Fa0/1 (Invalid Gateway)' },
          { from: 'sw1', to: 'pc2', status: 'normal', label: 'Fa0/2' }
        ]
      }),
      checklists: [
        'Run "ipconfig" on PC-01 and inspect Default Gateway address',
        'Compare PC-01 gateway against working PC-02 gateway',
        'Test ping from PC-01 to 192.168.10.1 (router inside interface)',
        'Update PC-01 Default Gateway to 192.168.10.1 and retest ping to 10.0.0.50'
      ],
      questions: [
        {
          question: 'What is causing PC-01 to lose connectivity to the remote Data Center server?',
          option_a: 'Incorrect subnet mask on PC-01',
          option_b: 'Incorrect default gateway configured on PC-01',
          option_c: 'Switch port shutdown on SW1',
          option_d: 'DNS failure on the authoritative name server',
          correct_answer: 'B',
          root_cause: 'Incorrect Default Gateway',
          explanation: 'PC-01 was configured with gateway 192.168.1.1 while the correct gateway for the 192.168.10.0/24 subnet was 192.168.10.1. Packets destined for foreign subnets could not be delivered to the local router interface.'
        }
      ],
      hints: [
        { order: 1, text: 'Notice PC-01 can ping PC-02 locally, but cannot ping any IP starting with 10.0.0.x.', penalty: 10 },
        { order: 2, text: 'Check the default gateway configured on PC-01 using ipconfig.', penalty: 20 },
        { order: 3, text: 'Change Default Gateway from 192.168.1.1 to 192.168.10.1 on PC-01 IPv4 settings.', penalty: 30 }
      ]
    },
    {
      title: 'Mission 05 — Administratively Shutdown Switch Port',
      description: 'A critical network printer in Marketing suddenly disappeared from the network after night-time maintenance.',
      difficulty: 'Medium',
      xp_reward: 175,
      category: 'Switching',
      stage: 2,
      stage_name: 'Switching & Gateway',
      estimated_time: '20 min',
      packet_tracer_file: 'mission05_switchport_shutdown.pka',
      order_index: 5,
      incident_id: 'INC-2045',
      department: 'Marketing & Design',
      reported_time: 'Today 02:40 PM',
      priority: 'Medium',
      scenario_text: 'The shared marketing network printer (Printer-MKT) on Switch SW-B2 port Fa0/12 is not responding to ping or print jobs. The LED on port 12 is amber/dark.',
      target_flag: 'FLAG{NO_SHUTDOWN_INTERFACE_RESTORED}',
      topology: JSON.stringify({
        nodes: [
          { id: 'r1', name: 'Gateway R1', type: 'router', ip: '192.168.20.1', status: 'online', x: 50, y: 20 },
          { id: 'sw2', name: 'Switch SW-B2', type: 'switch', ip: '192.168.20.2', status: 'online', x: 50, y: 50 },
          { id: 'pc1', name: 'Marketing PC', type: 'pc', ip: '192.168.20.30', status: 'online', x: 30, y: 80 },
          { id: 'ptr1', name: 'Printer-MKT', type: 'server', ip: '192.168.20.50', status: 'error', x: 70, y: 80, issue: 'Fa0/12 administratively down' }
        ],
        links: [
          { from: 'r1', to: 'sw2', status: 'normal', label: 'Gig0/0' },
          { from: 'sw2', to: 'pc1', status: 'normal', label: 'Fa0/1' },
          { from: 'sw2', to: 'ptr1', status: 'down', label: 'Fa0/12 (Admin Down)' }
        ]
      }),
      checklists: [
        'Connect console or Telnet to Switch SW-B2',
        'Execute: show ip interface brief | include FastEthernet0/12',
        'Observe interface status: administratively down, line protocol down',
        'Enter interface configuration mode and issue "no shutdown"'
      ],
      questions: [
        {
          question: 'What is the exact state of port FastEthernet0/12 according to Cisco IOS output?',
          option_a: 'up / up',
          option_b: 'administratively down / down',
          option_c: 'err-disabled / down',
          option_d: 'down / down (notconnect)',
          correct_answer: 'B',
          root_cause: 'Administrative Port Shutdown',
          explanation: 'The interface was manually disabled using the "shutdown" command during maintenance and never re-enabled with "no shutdown".'
        },
        {
          question: 'Which Cisco command is used to bring an administratively disabled interface back online?',
          option_a: 'interface restart',
          option_b: 'no shutdown',
          option_c: 'enable port',
          option_d: 'ip interface up',
          correct_answer: 'B',
          root_cause: 'Cisco IOS Interface Control',
          explanation: 'In interface configuration mode, "no shutdown" removes the administrative disable state and activates transceiver signaling.'
        }
      ],
      hints: [
        { order: 1, text: 'Open the CLI of Switch SW-B2 and check interface status with "show ip interface brief".', penalty: 10 },
        { order: 2, text: 'Notice Fa0/12 has Status "administratively down".', penalty: 20 },
        { order: 3, text: 'Enter: config t -> interface fa0/12 -> no shutdown -> end.', penalty: 30 }
      ]
    },
    {
      title: 'Mission 06 — VLAN Membership Isolation',
      description: 'A new developer PC was patched into the switch but cannot reach internal services due to improper VLAN access mapping.',
      difficulty: 'Medium',
      xp_reward: 200,
      category: 'VLAN',
      stage: 2,
      stage_name: 'Switching & Gateway',
      estimated_time: '25 min',
      packet_tracer_file: 'mission06_vlan_misconfiguration.pka',
      order_index: 6,
      incident_id: 'INC-2046',
      department: 'Software Engineering',
      reported_time: 'Today 03:50 PM',
      priority: 'High',
      scenario_text: 'Developer PC-DEV (192.168.30.45) is assigned to VLAN 30 on paper, but the switch port Fa0/8 is assigned to VLAN 1 (Default). Broadcasts and ARP packets never reach the VLAN 30 gateway sub-interface.',
      target_flag: 'FLAG{SWITCHPORT_ACCESS_VLAN_30_ENFORCED}',
      topology: JSON.stringify({
        nodes: [
          { id: 'r1', name: 'Router-on-a-Stick R1', type: 'router', ip: 'Sub-interfaces .10, .20, .30', status: 'online', x: 50, y: 20 },
          { id: 'sw1', name: 'Distribution Switch', type: 'switch', ip: 'VLAN 1: 192.168.1.5', status: 'online', x: 50, y: 50 },
          { id: 'pc_dev', name: 'PC-DEV (Developer)', type: 'pc', ip: '192.168.30.45/24', status: 'error', x: 30, y: 80, issue: 'Port Fa0/8 is in VLAN 1 instead of VLAN 30' },
          { id: 'git_srv', name: 'Git Repo Server', type: 'server', ip: '192.168.30.100/24 (VLAN 30)', status: 'online', x: 70, y: 80 }
        ],
        links: [
          { from: 'r1', to: 'sw1', status: 'normal', label: 'Gig0/0 (802.1Q Trunk)' },
          { from: 'sw1', to: 'pc_dev', status: 'warning', label: 'Fa0/8 (VLAN 1 Misassigned)' },
          { from: 'sw1', to: 'git_srv', status: 'normal', label: 'Fa0/18 (VLAN 30)' }
        ]
      }),
      checklists: [
        'Check current switch VLAN assignment using "show vlan brief"',
        'Inspect port FastEthernet0/8 in the VLAN table',
        'Verify target VLAN 30 exists on the switch database',
        'Run: interface fa0/8 -> switchport mode access -> switchport access vlan 30'
      ],
      questions: [
        {
          question: 'Why could PC-DEV not reach the Git Server even though both had 192.168.30.x IP addresses?',
          option_a: 'Fa0/8 was operating in half-duplex mode',
          option_b: 'Fa0/8 was assigned to VLAN 1 instead of VLAN 30, isolating broadcast domains',
          option_c: 'The router lacked an OSPF area definition',
          option_d: 'VTP pruning deleted VLAN 30 from the network',
          correct_answer: 'B',
          root_cause: 'VLAN Port Membership Misconfiguration',
          explanation: 'Switches segregate Layer 2 broadcast domains by VLAN. A port in VLAN 1 cannot forward Layer 2 frames to ports in VLAN 30 without a Layer 3 router.'
        }
      ],
      hints: [
        { order: 1, text: 'Run "show vlan brief" on the switch CLI.', penalty: 10 },
        { order: 2, text: 'Find port Fa0/8 in the list; note which VLAN name and ID it is mapped to.', penalty: 20 },
        { order: 3, text: 'Apply: switchport access vlan 30 under interface FastEthernet 0/8.', penalty: 30 }
      ]
    },
    {
      title: 'Mission 07 — 802.1Q Trunk Misconfiguration',
      description: 'Inter-switch trunking dropped traffic for the Voice and Operations VLAN due to a missing allowed list entry.',
      difficulty: 'Medium',
      xp_reward: 220,
      category: 'Switching',
      stage: 3,
      stage_name: 'Routing & Services',
      estimated_time: '25 min',
      packet_tracer_file: 'mission07_trunk_misconfiguration.pka',
      order_index: 7,
      incident_id: 'INC-2047',
      department: 'Operations',
      reported_time: 'Yesterday 04:10 PM',
      priority: 'High',
      scenario_text: 'A secondary switch SW2 was connected to core SW1 via GigabitEthernet0/1. Users on VLAN 40 on SW2 cannot reach services on SW1. Investigation shows the trunk allowed VLAN list on SW1 only includes VLANs 10,20.',
      target_flag: 'FLAG{TRUNK_ALLOWED_VLAN_ADD_40_APPLIED}',
      topology: JSON.stringify({
        nodes: [
          { id: 'sw1', name: 'Core Switch SW1', type: 'switch', ip: '10.1.1.1', status: 'online', x: 30, y: 40 },
          { id: 'sw2', name: 'Access Switch SW2', type: 'switch', ip: '10.1.1.2', status: 'warning', x: 70, y: 40, issue: 'VLAN 40 dropped across trunk' },
          { id: 'pc_ops', name: 'Ops Station (VLAN 40)', type: 'pc', ip: '192.168.40.12', status: 'error', x: 70, y: 80 },
          { id: 'ops_srv', name: 'Ops Controller (VLAN 40)', type: 'server', ip: '192.168.40.10', status: 'online', x: 30, y: 80 }
        ],
        links: [
          { from: 'sw1', to: 'sw2', status: 'warning', label: 'Gig0/1 Trunk (Allowed: 10,20)' },
          { from: 'sw1', to: 'ops_srv', status: 'normal', label: 'Fa0/24 (VLAN 40)' },
          { from: 'sw2', to: 'pc_ops', status: 'normal', label: 'Fa0/5 (VLAN 40)' }
        ]
      }),
      checklists: [
        'Check trunk interfaces using "show interfaces trunk"',
        'Inspect "Vlans allowed on trunk" for Gig0/1 on both switches',
        'Add VLAN 40 without overwriting existing VLANs: switchport trunk allowed vlan add 40',
        'Verify ping between Ops Station and Ops Controller'
      ],
      questions: [
        {
          question: 'Which Cisco command safely appends VLAN 40 to an existing trunk without replacing allowed VLANs?',
          option_a: 'switchport trunk allowed vlan 40',
          option_b: 'switchport trunk allowed vlan add 40',
          option_c: 'trunk vlan permit 40',
          option_d: 'vlan 40 trunk forward',
          correct_answer: 'B',
          root_cause: 'Trunk VLAN Pruning Restriction',
          explanation: 'Using "switchport trunk allowed vlan 40" wipes out all other VLANs! The "add" keyword is essential to retain existing permitted VLANs (10, 20).'
        }
      ],
      hints: [
        { order: 1, text: 'Run "show interfaces trunk" on SW1.', penalty: 10 },
        { order: 2, text: 'Look at the "Vlans allowed on trunk" line for Gig0/1.', penalty: 20 },
        { order: 3, text: 'Use "switchport trunk allowed vlan add 40" on interface Gig0/1 of SW1.', penalty: 30 }
      ]
    },
    {
      title: 'Mission 08 — Missing Static Route',
      description: 'Branch router cannot reach Headquarters database because the routing table has no route for the 172.16.0.0/16 prefix.',
      difficulty: 'Medium',
      xp_reward: 250,
      category: 'Routing',
      stage: 3,
      stage_name: 'Routing & Services',
      estimated_time: '25 min',
      packet_tracer_file: 'mission08_missing_static_route.pka',
      order_index: 8,
      incident_id: 'INC-2048',
      department: 'Branch Office North',
      reported_time: 'Today 08:30 AM',
      priority: 'High',
      scenario_text: 'Staff at Branch Office North cannot query the headquarters Oracle database server on 172.16.100.5. Branch router R-Branch has no default route and no static route pointing across the serial WAN link.',
      target_flag: 'FLAG{IP_ROUTE_172_16_0_0_STATIC_ADDED}',
      topology: JSON.stringify({
        nodes: [
          { id: 'r_hq', name: 'HQ Router', type: 'router', ip: 'Serial0/0/0: 10.254.1.1 | LAN: 172.16.1.1', status: 'online', x: 25, y: 30 },
          { id: 'r_br', name: 'Branch Router', type: 'router', ip: 'Serial0/0/0: 10.254.1.2 | LAN: 192.168.88.1', status: 'warning', x: 75, y: 30, issue: 'No route to 172.16.0.0' },
          { id: 'db_srv', name: 'HQ Oracle Database', type: 'server', ip: '172.16.100.5', status: 'online', x: 25, y: 75 },
          { id: 'pc_br', name: 'Branch Client', type: 'pc', ip: '192.168.88.10', status: 'error', x: 75, y: 75 }
        ],
        links: [
          { from: 'r_hq', to: 'r_br', status: 'normal', label: 'WAN Link (10.254.1.0/30)' },
          { from: 'r_hq', to: 'db_srv', status: 'normal', label: 'HQ LAN (172.16.0.0/16)' },
          { from: 'r_br', to: 'pc_br', status: 'normal', label: 'Branch LAN (192.168.88.0/24)' }
        ]
      }),
      checklists: [
        'Examine routing table on Branch Router using "show ip route"',
        'Confirm whether any entry matches destination 172.16.100.5',
        'Identify the next-hop IPv4 address on the HQ Serial link (10.254.1.1)',
        'Configure: ip route 172.16.0.0 255.255.0.0 10.254.1.1'
      ],
      questions: [
        {
          question: 'What happens when a Cisco router receives a packet for an IP address that has no matching entry in the routing table and no default route?',
          option_a: 'It broadcasts the packet out all interfaces',
          option_b: 'It stores the packet in NVRAM until a route is learned',
          option_c: 'It discards the packet and sends an ICMP Destination Unreachable message',
          option_d: 'It automatically creates an ARP proxy',
          correct_answer: 'C',
          root_cause: 'Routing Table Lookup Failure',
          explanation: 'Without a matching route or a Gateway of Last Resort (0.0.0.0/0), the router drops the packet and responds with ICMP Type 3 Code 0 (Net Unreachable).'
        }
      ],
      hints: [
        { order: 1, text: 'Run "show ip route" on R-Branch. Note that 172.16.0.0 is completely missing.', penalty: 10 },
        { order: 2, text: 'The next-hop address across the WAN serial link is 10.254.1.1.', penalty: 20 },
        { order: 3, text: 'Execute: ip route 172.16.0.0 255.255.0.0 10.254.1.1 on R-Branch.', penalty: 30 }
      ]
    },
    {
      title: 'Mission 09 — OSPF Neighbor Adjacency Failure',
      description: 'Two core routers refuse to form an OSPF adjacency because of an Area ID mismatch on the point-to-point link.',
      difficulty: 'Hard',
      xp_reward: 280,
      category: 'Routing',
      stage: 3,
      stage_name: 'Routing & Services',
      estimated_time: '30 min',
      packet_tracer_file: 'mission09_ospf_neighbor_down.pka',
      order_index: 9,
      incident_id: 'INC-2049',
      department: 'Infrastructure Core',
      reported_time: 'Today 09:00 AM',
      priority: 'Critical',
      scenario_text: 'Routers R1 and R2 are interconnected via GigabitEthernet0/0/1. OSPF neighbor state is stuck in INIT/DOWN. Hello packets are received, but adjacency never reaches FULL. R1 is configured for Area 0, but R2 network statement specifies Area 1.',
      target_flag: 'FLAG{OSPF_AREA_0_HELLO_MISMATCH_RESOLVED}',
      topology: JSON.stringify({
        nodes: [
          { id: 'r1', name: 'Core Router R1', type: 'router', ip: '10.0.12.1/30 (Area 0)', status: 'online', x: 30, y: 50 },
          { id: 'r2', name: 'Distribution Router R2', type: 'router', ip: '10.0.12.2/30 (Area 1 ❌)', status: 'error', x: 70, y: 50, issue: 'OSPF Area ID Mismatch: Area 1 vs Area 0' },
          { id: 'lan1', name: 'Campus LAN A', type: 'cloud', ip: '192.168.100.0/24', status: 'online', x: 15, y: 50 },
          { id: 'lan2', name: 'Campus LAN B', type: 'cloud', ip: '192.168.200.0/24', status: 'online', x: 85, y: 50 }
        ],
        links: [
          { from: 'r1', to: 'r2', status: 'down', label: 'Gig0/0/1 (OSPF Adjacency Dead)' },
          { from: 'r1', to: 'lan1', status: 'normal', label: 'Gig0/0' },
          { from: 'r2', to: 'lan2', status: 'normal', label: 'Gig0/0' }
        ]
      }),
      checklists: [
        'Run "show ip ospf neighbor" to observe empty neighbor table',
        'Check interface OSPF details: "show ip ospf interface gigabitethernet 0/0/1"',
        'Inspect running-config router ospf section on both routers',
        'Correct R2 network statement to match Area 0'
      ],
      questions: [
        {
          question: 'Which of the following parameters MUST match between two OSPF routers to establish full adjacency?',
          option_a: 'Router ID and Hostname',
          option_b: 'Area ID, Hello/Dead Timers, Subnet Mask, and Authentication',
          option_c: 'Process ID and Bandwidth',
          option_d: 'Priority number and MAC address',
          correct_answer: 'B',
          root_cause: 'OSPF Hello Packet Area ID Mismatch',
          explanation: 'OSPF Hello packets verify Area ID, Hello/Dead intervals, MTU, Subnet mask, and Auth flags. If Area ID differs, routers drop the Hellos and do not form 2-Way/ExStart/Full.'
        }
      ],
      hints: [
        { order: 1, text: 'Run "show ip ospf interface" on both R1 and R2 for interface Gig0/0/1.', penalty: 10 },
        { order: 2, text: 'Check the "Area" value reported on each side.', penalty: 20 },
        { order: 3, text: 'On R2: no network 10.0.12.0 0.0.0.3 area 1 -> network 10.0.12.0 0.0.0.3 area 0.', penalty: 30 }
      ]
    },
    {
      title: 'Mission 10 — DHCP Pool Exhaustion & Relay',
      description: 'Laptops connecting to Wi-Fi obtain 169.254.x.x APIPA addresses because the DHCP helper address is missing on the subinterface.',
      difficulty: 'Hard',
      xp_reward: 300,
      category: 'Troubleshooting',
      stage: 4,
      stage_name: 'Troubleshooting & Security',
      estimated_time: '30 min',
      packet_tracer_file: 'mission10_dhcp_relay_failure.pka',
      order_index: 10,
      incident_id: 'INC-2050',
      department: 'Corporate Headquarters',
      reported_time: 'Today 10:15 AM',
      priority: 'Critical',
      scenario_text: 'Employees returning to the office cannot obtain dynamic IPv4 addresses on the wireless VLAN 50. Their laptops display an Autoconfiguration IPv4 address (169.254.x.x). The centralized Windows DHCP server is on VLAN 100.',
      target_flag: 'FLAG{IP_HELPER_ADDRESS_FORWARDING_ACTIVE}',
      topology: JSON.stringify({
        nodes: [
          { id: 'dhcp_srv', name: 'Enterprise DHCP Server', type: 'server', ip: '10.100.1.10', status: 'online', x: 20, y: 30 },
          { id: 'r1', name: 'Core Router (Relay)', type: 'router', ip: 'Gig0/0.50: 192.168.50.1', status: 'warning', x: 50, y: 30, issue: 'Missing ip helper-address 10.100.1.10 on subinterface' },
          { id: 'ap1', name: 'Campus AP-Floor 2', type: 'switch', ip: '192.168.50.2', status: 'online', x: 50, y: 65 },
          { id: 'client', name: 'Mobile Client (APIPA)', type: 'pc', ip: '169.254.120.44 (Failed DORA)', status: 'error', x: 80, y: 65 }
        ],
        links: [
          { from: 'dhcp_srv', to: 'r1', status: 'normal', label: 'Gig0/1 (Server Subnet)' },
          { from: 'r1', to: 'ap1', status: 'warning', label: 'Gig0/0.50 (DHCP Discover Dropped)' },
          { from: 'ap1', to: 'client', status: 'down', label: 'VLAN 50 Wi-Fi' }
        ]
      }),
      checklists: [
        'Inspect IP address of Mobile Client using ipconfig to verify APIPA (169.254.x.x)',
        'Check router sub-interface Gig0/0.50 configuration',
        'Verify router does not forward broadcast UDP port 67/68 without relay agent',
        'Add "ip helper-address 10.100.1.10" to interface Gig0/0.50'
      ],
      questions: [
        {
          question: 'Why does a router by default drop DHCP Discover messages sent by clients on local broadcast domains?',
          option_a: 'DHCP requires TCP three-way handshake',
          option_b: 'Routers do not forward IPv4 broadcast packets (255.255.255.255) across interfaces by default',
          option_c: 'DHCP uses multicast reserved for routing protocols',
          option_d: 'The switch strips UDP headers',
          correct_answer: 'B',
          root_cause: 'Broadcast Boundary Isolation',
          explanation: 'Routers delimit broadcast domains. A DHCP Discover is a Layer 2/3 broadcast. To forward it to a remote DHCP unicast address, the router must act as a DHCP Relay Agent via "ip helper-address".'
        }
      ],
      hints: [
        { order: 1, text: 'Notice the client address begins with 169.254 — this indicates DHCP negotiation failed.', penalty: 10 },
        { order: 2, text: 'The DHCP server is located on subnet 10.100.1.0/24 at 10.100.1.10.', penalty: 20 },
        { order: 3, text: 'Configure "ip helper-address 10.100.1.10" under router sub-interface Gig0/0.50.', penalty: 30 }
      ]
    },
    {
      title: 'Mission 11 — Internal Domain DNS Resolution Failure',
      description: 'Workstations can ping the public internet by IP, but web browsers cannot resolve internal company domain names.',
      difficulty: 'Medium',
      xp_reward: 220,
      category: 'Troubleshooting',
      stage: 4,
      stage_name: 'Troubleshooting & Security',
      estimated_time: '20 min',
      packet_tracer_file: 'mission11_dns_resolution_fail.pka',
      order_index: 11,
      incident_id: 'INC-2051',
      department: 'Corporate Sales',
      reported_time: 'Today 11:50 AM',
      priority: 'High',
      scenario_text: 'Sales representatives can reach public websites like 8.8.8.8, but navigating to "portal.corp.local" generates "DNS_PROBE_FINISHED_NXDOMAIN". The workstation was manually configured with public DNS 8.8.8.8 instead of the internal corporate DNS server 192.168.10.53.',
      target_flag: 'FLAG{INTERNAL_DNS_SERVER_REDIRECTED}',
      topology: JSON.stringify({
        nodes: [
          { id: 'pub_dns', name: 'Public DNS (8.8.8.8)', type: 'cloud', ip: '8.8.8.8', status: 'online', x: 20, y: 20 },
          { id: 'corp_dns', name: 'Corp Internal DNS', type: 'server', ip: '192.168.10.53 (Zones: .corp.local)', status: 'online', x: 80, y: 20 },
          { id: 'r1', name: 'Edge Gateway', type: 'router', ip: '192.168.10.1', status: 'online', x: 50, y: 45 },
          { id: 'client', name: 'Sales Laptop', type: 'pc', ip: '192.168.10.88 (DNS: 8.8.8.8 ❌)', status: 'error', x: 50, y: 80, issue: 'DNS set to public resolver which has no knowledge of .corp.local' }
        ],
        links: [
          { from: 'pub_dns', to: 'r1', status: 'normal', label: 'Internet' },
          { from: 'corp_dns', to: 'r1', status: 'normal', label: 'DMZ' },
          { from: 'r1', to: 'client', status: 'warning', label: 'LAN (DNS Query Mismatch)' }
        ]
      }),
      checklists: [
        'Test ping 8.8.8.8 from Sales Laptop (succeeds)',
        'Test nslookup portal.corp.local 8.8.8.8 (fails with NXDOMAIN)',
        'Test nslookup portal.corp.local 192.168.10.53 (succeeds)',
        'Update primary IPv4 DNS server on Sales Laptop to 192.168.10.53'
      ],
      questions: [
        {
          question: 'Why could the Sales Laptop not resolve "portal.corp.local" when querying 8.8.8.8?',
          option_a: 'Port 53 was blocked by an outbound firewall rule',
          option_b: 'Public recursive resolvers do not possess authority or records for private internal namespaces (.corp.local)',
          option_c: 'The router ARP cache had expired',
          option_d: 'HTTP traffic was blocked by NAT',
          correct_answer: 'B',
          root_cause: 'Split-Brain DNS Scope Mismatch',
          explanation: 'Private enterprise domains (.corp.local) are hosted only on internal authoritative DNS servers. Public internet DNS servers like 8.8.8.8 have no knowledge of RFC 1918 internal records.'
        }
      ],
      hints: [
        { order: 1, text: 'Run "nslookup portal.corp.local" on the PC command prompt.', penalty: 10 },
        { order: 2, text: 'Notice which DNS server answered the query. Is it the internal server 192.168.10.53?', penalty: 20 },
        { order: 3, text: 'Change the PC Preferred DNS Server in IPv4 settings to 192.168.10.53.', penalty: 30 }
      ]
    },
    {
      title: 'Mission 12 — The Enterprise Network Meltdown',
      description: 'Capstone multi-layer disaster combining an incorrect gateway, an ACL blocking ICMP/HTTP, and native VLAN mismatch.',
      difficulty: 'Hard',
      xp_reward: 350,
      category: 'Security',
      stage: 4,
      stage_name: 'Troubleshooting & Security',
      estimated_time: '35 min',
      packet_tracer_file: 'mission12_enterprise_meltdown.pka',
      order_index: 12,
      incident_id: 'INC-2052',
      department: 'Executive Operations & Data Center',
      reported_time: 'Today 04:30 PM',
      priority: 'Critical',
      scenario_text: 'A major network change went wrong during a security audit. Executive workstations cannot access the secure Core Vault. The investigation reveals three concurrent defects: an outbound Access Control List dropping TCP port 443, a native VLAN mismatch on the inter-switch trunk, and an erroneous default gateway on the disaster recovery server.',
      target_flag: 'FLAG{ENTERPRISE_CAPSTONE_TRIAGE_MASTER}',
      topology: JSON.stringify({
        nodes: [
          { id: 'fw', name: 'Perimeter Firewall', type: 'router', ip: 'ACL 101 Deny TCP 443 ❌', status: 'error', x: 20, y: 30, issue: 'ACL blocking secure HTTPS traffic' },
          { id: 'core_sw', name: 'Core Switch 01', type: 'switch', ip: 'Native VLAN 99 ❌', status: 'warning', x: 50, y: 30, issue: 'Native VLAN mismatch with Access Switch' },
          { id: 'acc_sw', name: 'Access Switch 02', type: 'switch', ip: 'Native VLAN 1', status: 'warning', x: 80, y: 30 },
          { id: 'vault', name: 'Core Vault (Secure DB)', type: 'server', ip: '10.50.0.100 (Wrong GW ❌)', status: 'error', x: 30, y: 75, issue: 'Default Gateway points to decommissioned IP' },
          { id: 'ceo_pc', name: 'Executive Terminal', type: 'pc', ip: '192.168.99.10', status: 'error', x: 70, y: 75 }
        ],
        links: [
          { from: 'fw', to: 'core_sw', status: 'warning', label: 'Gig0/0 (ACL Filter)' },
          { from: 'core_sw', to: 'acc_sw', status: 'down', label: 'Gig0/1 Trunk (Native Mismatch 99 vs 1)' },
          { from: 'core_sw', to: 'vault', status: 'warning', label: 'Fa0/24 (Gateway Broken)' },
          { from: 'acc_sw', to: 'ceo_pc', status: 'normal', label: 'Fa0/1' }
        ]
      }),
      checklists: [
        'Analyze Native VLAN mismatch CDP error messages on Core Switch 01',
        'Standardize native VLAN on trunk: switchport trunk native vlan 99',
        'Inspect Access-List 101 on Perimeter Firewall and permit HTTPS: permit tcp any any eq 443',
        'Correct Core Vault Default Gateway to 10.50.0.1',
        'Verify end-to-end HTTPS transaction from Executive Terminal to Core Vault'
      ],
      questions: [
        {
          question: 'What CDP syslog warning is emitted when two connected Cisco switches have differing native VLAN configurations on an 802.1Q trunk?',
          option_a: '%SPANTREE-2-BLOCK_BPDUGUARD',
          option_b: '%CDP-4-NATIVE_VLAN_MISMATCH',
          option_c: '%OSPF-5-ADJCHANGE',
          option_d: '%LINK-3-UPDOWN',
          correct_answer: 'B',
          root_cause: '802.1Q Native VLAN Discrepancy & Spanning-Tree Inconsistency',
          explanation: 'Cisco Discovery Protocol (CDP) monitors trunk configuration. If switch A treats untagged traffic as VLAN 99 and switch B treats it as VLAN 1, CDP reports %CDP-4-NATIVE_VLAN_MISMATCH and STP may unforward the port.'
        },
        {
          question: 'In standard Cisco extended ACL syntax, where should an "established" or "permit tcp any any eq 443" rule be positioned relative to a general "deny ip any any"?',
          option_a: 'After the deny rule',
          option_b: 'Before the explicit or implicit deny rule, because ACLs process top-down with first-match termination',
          option_c: 'At the bottom of the ACL file',
          option_d: 'Order does not matter in Cisco ACLs',
          correct_answer: 'B',
          root_cause: 'ACL Sequential Top-Down Evaluation Order',
          explanation: 'Cisco access-lists evaluate statements top-down until a match is found. If a deny precedes a permit, traffic matching both is immediately dropped.'
        }
      ],
      hints: [
        { order: 1, text: 'Check the CDP syslog messages appearing on Core Switch 01.', penalty: 10 },
        { order: 2, text: 'Check the access-list applied outbound on Perimeter Firewall interface Gig0/0.', penalty: 20 },
        { order: 3, text: 'Fix the native VLAN on SW02, permit tcp eq 443 in ACL 101, and update Core Vault gateway to 10.50.0.1.', penalty: 30 }
      ]
    }
  ];

  const insertMission = db.prepare(`
    INSERT INTO missions (
      title, description, difficulty, xp_reward, category, stage, stage_name,
      estimated_time, packet_tracer_file, order_index, incident_id, department,
      reported_time, priority, scenario_text, target_flag, topology_json, checklists_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTask = db.prepare(`
    INSERT INTO mission_tasks (mission_id, task_type, title, content, order_index)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertQuestion = db.prepare(`
    INSERT INTO questions (
      mission_id, question, option_a, option_b, option_c, option_d, correct_answer, root_cause, explanation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHint = db.prepare(`
    INSERT INTO hints (mission_id, hint_order, hint_text, xp_penalty)
    VALUES (?, ?, ?, ?)
  `);

  missionsData.forEach((m) => {
    const res = insertMission.run(
      m.title,
      m.description,
      m.difficulty,
      m.xp_reward,
      m.category,
      m.stage,
      m.stage_name,
      m.estimated_time,
      m.packet_tracer_file,
      m.order_index,
      m.incident_id,
      m.department,
      m.reported_time,
      m.priority,
      m.scenario_text,
      m.target_flag,
      m.topology,
      typeof m.checklists === 'string' ? m.checklists : JSON.stringify(m.checklists)
    );

    const missionId = Number(res.lastInsertRowid);

    // Standard 6 Tasks per mission
    const tasks = [
      { type: 'scenario', title: 'Task 1 — Incident Scenario', content: m.scenario_text, order: 1 },
      { type: 'diagram', title: 'Task 2 — Network Topology Diagram', content: 'Inspect the connected nodes, interface mappings, and diagnostic telemetry.', order: 2 },
      { type: 'lab', title: 'Task 3 — Cisco Packet Tracer Lab', content: `Download and open ${m.packet_tracer_file} to troubleshoot inside the simulated Cisco IOS environment.`, order: 3 },
      { type: 'investigation', title: 'Task 4 — Interactive Investigation', content: 'Follow the diagnostic checklist and investigate configuration parameters.', order: 4 },
      { type: 'questions', title: 'Task 5 — CTF Knowledge Questions', content: 'Answer technical multiple-choice questions regarding root causes and Cisco CLI verification.', order: 5 },
      { type: 'flag', title: 'Task 6 — Capture the Flag & Rewards', content: 'Submit the discovered flag key to claim XP, badges, and advance.', order: 6 }
    ];

    tasks.forEach((t) => {
      insertTask.run(missionId, t.type, t.title, t.content, t.order);
    });

    // Insert questions
    m.questions.forEach((q) => {
      insertQuestion.run(missionId, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.root_cause, q.explanation);
    });

    // Insert hints
    m.hints.forEach((h) => {
      insertHint.run(missionId, h.order, h.text, h.penalty);
    });
  });
}

function seedAchievements() {
  const achievements = [
    { slug: 'first_connection', name: 'First Connection', description: 'Complete your first network engineering mission.', icon: 'Cable', category: 'Milestone' },
    { slug: 'troubleshooter', name: 'Master Troubleshooter', description: 'Complete 5 troubleshooting missions successfully.', icon: 'ShieldAlert', category: 'Troubleshooting' },
    { slug: 'routing_rookie', name: 'Routing Rookie', description: 'Complete your first IP routing mission.', icon: 'Route', category: 'Routing' },
    { slug: 'vlan_master', name: 'VLAN Master', description: 'Successfully isolate and solve all VLAN & Trunk challenges.', icon: 'Network', category: 'Switching' },
    { slug: 'no_hints', name: 'Pure Instinct', description: 'Complete a mission without revealing any hints.', icon: 'Zap', category: 'Excellence' },
    { slug: 'perfect_engineer', name: 'Perfect Engineer', description: 'Complete 3 missions earning 100% maximum possible XP.', icon: 'Award', category: 'Excellence' },
    { slug: 'subnet_samurai', name: 'Subnet Samurai', description: 'Solve IP addressing & VLSM subnetting calculations on the first try.', icon: 'Binary', category: 'IP Addressing' },
    { slug: 'packet_tracer_pro', name: 'Packet Tracer Pro', description: 'Download and verify 3 Cisco Packet Tracer lab topologies.', icon: 'Terminal', category: 'Lab' }
  ];

  const insert = db.prepare(`
    INSERT INTO achievements (slug, name, description, icon, category)
    VALUES (?, ?, ?, ?, ?)
  `);

  achievements.forEach((a) => {
    insert.run(a.slug, a.name, a.description, a.icon, a.category);
  });
}

function seedAssessmentQuestions() {
  const questions = [
    {
      category: 'IP Addressing',
      question: 'Which of the following is a valid usable host IPv4 address within the subnet 192.168.1.64/26?',
      option_a: '192.168.1.64',
      option_b: '192.168.1.100',
      option_c: '192.168.1.127',
      option_d: '192.168.1.128',
      correct_answer: 'B',
      explanation: 'In 192.168.1.64/26, the network address is .64, the broadcast is .127, and usable host addresses range from .65 to .126. 192.168.1.100 falls inside this range.'
    },
    {
      category: 'Subnetting',
      question: 'How many usable host IP addresses are provided by a /29 subnet mask (255.255.255.248)?',
      option_a: '2',
      option_b: '6',
      option_c: '8',
      option_d: '14',
      correct_answer: 'B',
      explanation: 'A /29 mask leaves 3 host bits (32 - 29 = 3). 2^3 - 2 = 8 - 2 = 6 usable host addresses.'
    },
    {
      category: 'VLAN',
      question: 'What is the primary purpose of configuring an 802.1Q trunk port between two switches?',
      option_a: 'To aggregate bandwidth into an EtherChannel port-channel',
      option_b: 'To carry traffic from multiple VLANs across a single physical link by inserting a 4-byte VLAN tag',
      option_c: 'To assign static IP addresses to end workstations',
      option_d: 'To encrypt Layer 2 frames with AES-256',
      correct_answer: 'B',
      explanation: 'IEEE 802.1Q trunking tags Ethernet frames with a VLAN ID so multiple VLANs can traverse a single inter-switch link.'
    },
    {
      category: 'Default Gateway',
      question: 'When a host PC on 10.0.1.50/24 sends a packet to a server at 172.16.5.10, what destination MAC address does the host put in the Layer 2 Ethernet frame?',
      option_a: 'The server MAC address (172.16.5.10)',
      option_b: 'The broadcast MAC address (FF:FF:FF:FF:FF:FF)',
      option_c: 'The MAC address of the host local Default Gateway router',
      option_d: 'All zeros (00:00:00:00:00:00)',
      correct_answer: 'C',
      explanation: 'Because 172.16.5.10 is on an off-link network, the host PC uses ARP to resolve and frame the destination MAC of its configured Default Gateway.'
    },
    {
      category: 'Routing',
      question: 'Which routing protocol metric is calculated primarily based on the lowest cumulative interface bandwidth along a path?',
      option_a: 'RIP (Hop Count)',
      option_b: 'OSPF (Cost = 10^8 / Bandwidth)',
      option_c: 'BGP (AS Path)',
      option_d: 'STP (Root Path Priority)',
      correct_answer: 'B',
      explanation: 'OSPF calculates path cost as reference bandwidth / interface bandwidth. Lower cost indicates faster bandwidth.'
    },
    {
      category: 'Troubleshooting',
      question: 'A user reports: "I can ping other computers in my room, but I cannot access Google or intranet servers in building B." What is the most probable configuration defect?',
      option_a: 'Defective Ethernet patch cable',
      option_b: 'Missing or misconfigured Default Gateway on the user PC',
      option_c: 'Duplex mismatch between PC and local switch',
      option_d: 'Power outage on the local floor switch',
      correct_answer: 'B',
      explanation: 'If local LAN communication works, Layer 1 and Layer 2 are operational within the broadcast domain. Inability to reach other subnets points to Default Gateway or routing failures.'
    },
    {
      category: 'Switching',
      question: 'Which Cisco command shows whether a switch interface is in Access or Trunk mode, its operational VLAN, and administrative tagging state?',
      option_a: 'show ip arp',
      option_b: 'show mac address-table',
      option_c: 'show interfaces <interface_id> switchport',
      option_d: 'show spanning-tree brief',
      correct_answer: 'C',
      explanation: '"show interfaces <id> switchport" displays detailed Layer 2 switchport properties, including administrative/operational mode, access VLAN, trunk encapsulation, and native VLAN.'
    },
    {
      category: 'Network Security',
      question: 'What is the default behavior at the end of every Cisco Access Control List (ACL)?',
      option_a: 'Implicit permit ip any any',
      option_b: 'Implicit deny ip any any',
      option_c: 'Log all unhandled packets to syslog',
      option_d: 'Forward to router default gateway',
      correct_answer: 'B',
      explanation: 'All Cisco standard and extended ACLs contain an invisible, implicit "deny ip any any" at the bottom that drops any packet not explicitly permitted.'
    }
  ];

  const insert = db.prepare(`
    INSERT INTO assessment_questions (category, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  questions.forEach((q) => {
    insert.run(q.category, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation);
  });
}

function seedDefaultUser() {
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, level, xp, coins, streak, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const userRes = insertUser.run(
    'cadet_networker',
    'student@capstone.edu',
    'demo123',
    2,
    650,
    1200,
    4,
    new Date().toISOString()
  );

  const userId = Number(userRes.lastInsertRowid);

  // Mark Mission 1 & 2 completed, Mission 3 in_progress (65%), others unlocked/locked
  const insertProg = db.prepare(`
    INSERT INTO user_progress (user_id, mission_id, status, score, xp_earned, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertProg.run(userId, 1, 'completed', 100, 100, new Date(Date.now() - 86400000 * 2).toISOString());
  insertProg.run(userId, 2, 'completed', 120, 120, new Date(Date.now() - 86400000).toISOString());
  insertProg.run(userId, 3, 'completed', 130, 130, new Date(Date.now() - 43200000).toISOString());
  insertProg.run(userId, 4, 'in_progress', 65, 0, null); // Mission 04: The Missing Gateway
  insertProg.run(userId, 5, 'unlocked', 0, 0, null);
  insertProg.run(userId, 6, 'unlocked', 0, 0, null);
  for (let i = 7; i <= 12; i++) {
    insertProg.run(userId, i, 'locked', 0, 0, null);
  }

  // Award First Connection achievement
  const ach = db.prepare('SELECT id FROM achievements WHERE slug = ?').get('first_connection') as { id: number } | undefined;
  if (ach) {
    db.prepare('INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)')
      .run(userId, ach.id, new Date().toISOString());
  }

  // Add pre-test sample result for student capstone research comparison (e.g. 55% score)
  db.prepare(`
    INSERT INTO assessment_results (user_id, assessment_type, score, total_questions, completed_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, 'pretest', 55, 100, new Date(Date.now() - 86400000 * 3).toISOString());

  // Seed simulated leaderboard users for competitive university feel
  const mockStudents = [
    { username: 'cisco_wizard', email: 'wizard@net.edu', level: 5, xp: 3200, coins: 4800, streak: 12 },
    { username: 'packet_ninja', email: 'ninja@net.edu', level: 4, xp: 2450, coins: 3400, streak: 9 },
    { username: 'subnet_slayer', email: 'slayer@net.edu', level: 3, xp: 1850, coins: 2600, streak: 6 },
    { username: 'vlan_valkyrie', email: 'valk@net.edu', level: 3, xp: 1400, coins: 2100, streak: 5 },
    { username: 'router_rebel', email: 'rebel@net.edu', level: 2, xp: 850, coins: 1400, streak: 3 },
    { username: 'byte_bandit', email: 'bandit@net.edu', level: 1, xp: 350, coins: 600, streak: 2 }
  ];

  mockStudents.forEach((st) => {
    const res = insertUser.run(st.username, st.email, 'demo123', st.level, st.xp, st.coins, st.streak, new Date().toISOString());
    const mockId = Number(res.lastInsertRowid);
    // Mark random completed missions for mock students
    const mCount = st.level >= 4 ? 8 : st.level * 2;
    for (let m = 1; m <= mCount; m++) {
      insertProg.run(mockId, m, 'completed', 100, 100, new Date().toISOString());
    }
  });
}
