import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'th';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // TopNav & Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.learning_path': 'Learning Paths',
    'nav.missions': 'Missions',
    'nav.packet_tracer': 'Packet Tracer Labs',
    'nav.leaderboard': 'Leaderboard',
    'nav.achievements': 'Achievements',
    'nav.profile': 'Profile',
    'nav.assessment': 'Pre/Post Test',
    'nav.research': 'RESEARCH',
    'nav.logout': 'Logout',
    'nav.training_operations': 'Training Operations',
    'nav.search_placeholder': 'Search missions, labs, topics (e.g. VLAN, OSPF)...',
    'nav.days': 'days',
    'nav.points': 'XP',
    'nav.coins': 'Coins',
    'nav.level': 'LVL',
    'nav.cadet': 'Cadet',
    'nav.notifications_title': 'Security Dispatch & Alerts',
    'nav.new_alerts': 'NEW',

    // Login Page
    'login.title': 'NETWORK ENGINEER CTF',
    'login.subtitle': 'University Capstone Learning Platform',
    'login.hero_heading': 'Learn Networking by Solving Real Problems',
    'login.hero_desc': 'Practice real-world networking scenarios through interactive missions, troubleshooting challenges, and Cisco Packet Tracer labs. Investigate topologies, find root causes, capture flags, and gain engineering XP.',
    'login.feat_labs_title': 'Network Labs',
    'login.feat_labs_desc': 'Simulated Packet Tracer topologies with real router & switch CLI.',
    'login.feat_troubleshoot_title': 'Troubleshooting',
    'login.feat_troubleshoot_desc': 'Diagnose physical, VLAN, trunking, gateway, and routing incidents.',
    'login.feat_ctf_title': 'CTF Challenges',
    'login.feat_ctf_desc': 'Capture technical flags, level up skills, and climb class rankings.',
    'login.research_tag': 'Academic Research Edition — Includes Pre-Test & Post-Test Metrics',
    'login.tab_login': 'Login to Account',
    'login.tab_register': 'Create Account',
    'login.username': 'Student Username',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.forgot_pwd': 'Forgot Password?',
    'login.btn_login': 'Login to Lab',
    'login.btn_register': 'Create Account',
    'login.quick_demo': 'Quick Evaluator Access',
    'login.btn_demo': '1-Click Demo Login (Cadet Networker)',

    // Dashboard
    'dash.welcome': 'Welcome back',
    'dash.env_active': 'Network Engineering CTF Training Environment // Session Active',
    'dash.capstone_badge': 'Capstone Assessment',
    'dash.posttest_prompt': 'Take Post-Test to evaluate skill growth',
    'dash.continue_learning': 'CONTINUE LEARNING',
    'dash.continue_btn': 'Continue Mission',
    'dash.progress': 'Progress',
    'dash.stat_level': 'Level',
    'dash.stat_total_xp': 'Total XP',
    'dash.stat_missions_done': 'Missions Done',
    'dash.stat_flags': 'Flags Captured',
    'dash.stat_streak': 'Active Streak',
    'dash.domain_title': 'Learning Progress by Network Domain',
    'dash.domain_desc': 'Track your mastery across core Cisco CCNA and troubleshooting competencies',
    'dash.view_complete_path': 'View Complete Path',
    'dash.recommended_title': 'Recommended Missions',
    'dash.recommended_desc': 'Targeted network incidents ready for your investigation',
    'dash.browse_all': 'Browse All 12 Missions',

    // Learning Path
    'path.title': 'Network Engineering Learning Path',
    'path.subtitle': 'Progress sequentially through realistic incident missions. Each stage builds prerequisite networking competencies required for enterprise deployment and Cisco certification.',
    'path.stage_cleared': 'STAGE CLEARED',
    'path.active': 'ACTIVE',
    'path.locked': 'LOCKED',
    'path.solved': 'SOLVED',
    'path.completed_count': 'Completed',

    // Missions Catalog
    'missions.catalog_title': 'Network CTF Missions Catalog',
    'missions.catalog_subtitle': '12 Specialized Network Engineering & Troubleshooting Challenges',
    'missions.filter_category': 'Category:',
    'missions.filter_difficulty': 'Difficulty:',
    'missions.showing': 'Showing',
    'missions.of': 'of',
    'missions.launch': 'Launch',
    'missions.review': 'Review',

    // Mission Room
    'room.back': 'Back to Missions Catalog',
    'room.task1': 'Task 1 — Scenario',
    'room.task2': 'Task 2 — Network Diagram',
    'room.task3': 'Task 3 — Packet Tracer Lab',
    'room.task4': 'Task 4 — Investigation',
    'room.task5': 'Task 5 — Questions',
    'room.task6': 'Task 6 — Capture the Flag',
    'room.checklist_title': 'Mission Tasks Checklist',
    'room.incident_id': 'Incident ID',
    'room.department': 'Department',
    'room.flag_status': 'Flag Status',
    'room.pending': 'Pending',
    'room.captured': 'Captured',
    'room.start_investigation': 'Start Investigation',
    'room.open_lab': 'Open Network Lab',
    'room.download_lab': 'Download Lab',
    'room.open_instructions': 'Open Instructions',
    'room.packet_tracer_notice': 'Cisco Packet Tracer Requirement: Cisco Packet Tracer must be installed on your computer. Download the .pka file above, launch it with Packet Tracer, examine device configurations, and troubleshoot according to the incident brief.',
    'room.step_objectives': 'Step-by-Step Diagnostic Objectives',
    'room.simulated_cli': 'Simulated Command Line Diagnostics',
    'room.hints_title': 'Network Investigation Clues & Hints',
    'room.hints_desc': 'Unlocking clues incurs an XP deduction penalty.',
    'room.available_xp': 'Available XP',
    'room.submit_answer': 'Submit Answer',
    'room.correct': 'Correct! Verification Successful.',
    'room.incorrect': 'Incorrect Answer. Try again.',
    'room.root_cause': 'Root Cause Identified',
    'room.mission_complete': 'MISSION COMPLETE',
    'room.mission_complete_sub': 'You have successfully investigated and resolved the network incident.',
    'room.submit_flag': 'Submit Flag',
    'room.next_mission': 'Next Mission',
    'room.paste_flag': 'Paste Resolved Flag',

    // Packet Tracer Page
    'pt.title': 'Cisco Packet Tracer Lab Repository',
    'pt.subtitle': 'Downloadable .PKA Lab Activities for Hands-On Investigation',
    'pt.instructions_title': 'How to Practice with Simulated Packet Tracer Files',
    'pt.instructions_desc': '1. Download the designated .pka file. 2. Open it in Cisco Packet Tracer. 3. Diagnose the misconfiguration in the topology. 4. Return to the Mission Room to verify answers and submit your flag.',
    'pt.get_pt': 'Get Packet Tracer',
    'pt.download_pka': 'Download .PKA',
    'pt.open_room': 'Open Room',

    // Leaderboard
    'lb.title': 'Network CTF Leaderboard',
    'lb.subtitle': 'Top performing network engineers ranked by verified flags, problem-solving speed, and technical XP.',
    'lb.rank': 'Rank',
    'lb.cadet': 'Engineer / Cadet',
    'lb.level': 'Rank / Level',
    'lb.flags': 'Flags',
    'lb.missions': 'Missions',
    'lb.xp': 'Total XP',
    'lb.you': 'YOU',
    'lb.all_time': 'All Time',

    // Achievements
    'ach.title': 'Network Engineer Honors & Achievements',
    'ach.subtitle': 'Earned for operational milestones, troubleshooting accuracy, and mastery',
    'ach.unlocked_badges': 'Badges Unlocked',

    // Profile
    'prof.capstone_title': 'University Capstone Research Assessment',
    'prof.capstone_sub': 'Pre-Test vs Post-Test Empirical Learning Gains',
    'prof.baseline_pre': 'Baseline Pre-Test',
    'prof.post_training': 'Post-Training Post-Test',
    'prof.measured_growth': 'Measured Improvement',
    'prof.open_assessment': 'Open Assessment Center',

    // Assessment
    'assess.title': 'Pre-Test & Post-Test Assessment',
    'assess.subtitle': 'Standardized networking competency assessment designed to evaluate learning effectiveness before and after hands-on CTF simulator training.',
    'assess.pretest_tab': 'Take Pre-Test (Baseline)',
    'assess.posttest_tab': 'Take Post-Test (Evaluation)',
    'assess.submit': 'Submit Test',
    'assess.score': 'Score',
    'assess.success_msg': 'SUBMITTED SUCCESSFULLY!',
    'assess.growth': 'Empirical Growth'
  },
  th: {
    // TopNav & Sidebar
    'nav.dashboard': 'แดชบอร์ด',
    'nav.learning_path': 'เส้นทางการเรียนรู้',
    'nav.missions': 'ภารกิจทั้งหมด',
    'nav.packet_tracer': 'ดาวน์โหลดแล็บ Packet Tracer',
    'nav.leaderboard': 'ตารางอันดับ',
    'nav.achievements': 'เหรียญเกียรติยศ',
    'nav.profile': 'ข้อมูลผู้ใช้',
    'nav.assessment': 'แบบทดสอบก่อนและหลังเรียน',
    'nav.research': 'งานวิจัย',
    'nav.logout': 'ออกจากระบบ',
    'nav.training_operations': 'ปฏิบัติการฝึกอบรม',
    'nav.search_placeholder': 'ค้นหาภารกิจ, หัวข้อเครือข่าย (เช่น VLAN, OSPF, Gateway)...',
    'nav.days': 'วันต่อเนื่อง',
    'nav.points': 'คะแนน XP',
    'nav.coins': 'เหรียญ',
    'nav.level': 'ระดับ',
    'nav.cadet': 'นายช่างฝึกหัด',
    'nav.notifications_title': 'การแจ้งเตือนเหตุขัดข้องระบบเครือข่าย',
    'nav.new_alerts': 'ใหม่',

    // Login Page
    'login.title': 'NETWORK ENGINEER CTF',
    'login.subtitle': 'แพลตฟอร์มจำลองการแก้ปัญหาเครือข่ายสำหรับโครงงานปริญญานิพนธ์',
    'login.hero_heading': 'เรียนรู้ระบบเครือข่ายผ่านการแก้ปัญหาในสถานการณ์จริง',
    'login.hero_desc': 'ฝึกฝนทักษะวิศวกรรมเครือข่ายและการแก้ไขปัญหาผ่านภารกิจจำลอง คำถามตรวจทานเชิงเทคนิค และไฟล์แล็บ Cisco Packet Tracer ร่วมค้นหาสาเหตุของปัญหา ชิงธง และเพิ่มคะแนนประสบการณ์ XP',
    'login.feat_labs_title': 'แล็บเครือข่ายจำลอง',
    'login.feat_labs_desc': 'โทโพโลยี Packet Tracer พร้อมคำสั่ง Cisco CLI เสมือนจริง',
    'login.feat_troubleshoot_title': 'การแก้ปัญหาเครือข่าย',
    'login.feat_troubleshoot_desc': 'วิเคราะห์ปัญหาชั้นกายภาพ VLAN, Trunk, Gateway และ Routing',
    'login.feat_ctf_title': 'ความท้าทายแบบ CTF',
    'login.feat_ctf_desc': 'ค้นหาและส่ง FLAG, อัปเลเวล และไต่อันดับคะแนนประจำรุ่น',
    'login.research_tag': 'เวอร์ชันวิจัยปริญญานิพนธ์ — มีระบบวัดผลก่อนเรียนและหลังเรียนครบถ้วน',
    'login.tab_login': 'เข้าสู่ระบบ',
    'login.tab_register': 'สมัครบัญชีใหม่',
    'login.username': 'ชื่อผู้ใช้ของนักศึกษา',
    'login.email': 'อีเมลนักศึกษา',
    'login.password': 'รหัสผ่าน',
    'login.forgot_pwd': 'ลืมรหัสผ่าน?',
    'login.btn_login': 'เข้าสู่ห้องแล็บ',
    'login.btn_register': 'สร้างบัญชีผู้ใช้',
    'login.quick_demo': 'ทางลัดสำหรับอาจารย์/ผู้ประเมินโครงงาน',
    'login.btn_demo': 'คลิกเดียวเพื่อเข้าสู่ระบบตัวอย่าง',

    // Dashboard
    'dash.welcome': 'ยินดีต้อนรับกลับ',
    'dash.env_active': 'ระบบจำลองการฝึกอบรมวิศวกรรมเครือข่าย CTF // ออนไลน์พร้อมใช้งาน',
    'dash.capstone_badge': 'การประเมินผลการเรียนรู้วิจัย',
    'dash.posttest_prompt': 'ทำแบบทดสอบหลังเรียนเพื่อประเมินพัฒนาการ',
    'dash.continue_learning': 'เรียนรู้ต่อจากจุดเดิม',
    'dash.continue_btn': 'ทำภารกิจต่อ',
    'dash.progress': 'ความคืบหน้า',
    'dash.stat_level': 'ระดับเลเวล',
    'dash.stat_total_xp': 'คะแนน XP รวม',
    'dash.stat_missions_done': 'ภารกิจที่สำเร็จ',
    'dash.stat_flags': 'ธงที่พิชิตได้',
    'dash.stat_streak': 'เรียนต่อเนื่อง',
    'dash.domain_title': 'ความคืบหน้าตามหมวดหมู่วิชาเครือข่าย',
    'dash.domain_desc': 'ติดตามความเชี่ยวชาญตามมาตรฐาน Cisco CCNA และทักษะการตรวจสอบปัญหา',
    'dash.view_complete_path': 'ดูเส้นทางการเรียนรู้ทั้งหมด',
    'dash.recommended_title': 'ภารกิจแนะนำสำหรับคุณ',
    'dash.recommended_desc': 'เหตุขัดข้องของระบบเครือข่ายที่พร้อมให้คุณเข้าตรวจสอบ',
    'dash.browse_all': 'ดูภารกิจทั้งหมด 12 ภารกิจ',

    // Learning Path
    'path.title': 'แผนผังเส้นทางการเรียนรู้วิศวกรรมเครือข่าย',
    'path.subtitle': 'เรียนรู้ตามลำดับขั้นจากเหตุการณ์จริง แต่ละระดับช่วยเสริมทักษะพื้นฐานที่จำเป็นสำหรับการปฏิบัติงานในองค์กรและการสอบประกาศนียบัตร Cisco',
    'path.stage_cleared': 'ผ่านด่านแล้ว',
    'path.active': 'กำลังปฏิบัติงาน',
    'path.locked': 'ยังไม่ปลดล็อก',
    'path.solved': 'สำเร็จแล้ว',
    'path.completed_count': 'สำเร็จแล้ว',

    // Missions Catalog
    'missions.catalog_title': 'รายการภารกิจ Network CTF ทั้งหมด',
    'missions.catalog_subtitle': '12 ภารกิจฝึกแก้ปัญหาเครือข่ายจำลองสถานการณ์จากองค์กรจริง',
    'missions.filter_category': 'หมวดหมู่:',
    'missions.filter_difficulty': 'ระดับความยาก:',
    'missions.showing': 'แสดง',
    'missions.of': 'จากทั้งหมด',
    'missions.launch': 'เริ่มภารกิจ',
    'missions.review': 'ทบทวนภารกิจ',

    // Mission Room
    'room.back': 'กลับไปยังหน้ารายการภารกิจ',
    'room.task1': 'ภารกิจที่ 1 — สถานการณ์และใบแจ้งเหตุ',
    'room.task2': 'ภารกิจที่ 2 — แผนผังเครือข่าย',
    'room.task3': 'ภารกิจที่ 3 — ดาวน์โหลดแล็บ Packet Tracer',
    'room.task4': 'ภารกิจที่ 4 — ตรวจสอบและค้นหาสาเหตุ',
    'room.task5': 'ภารกิจที่ 5 — คำถามตรวจทานทางเทคนิค',
    'room.task6': 'ภารกิจที่ 6 — ชิงธง',
    'room.checklist_title': 'รายการขั้นตอนการปฏิบัติงาน',
    'room.incident_id': 'รหัสแจ้งเหตุ',
    'room.department': 'แผนกที่ได้รับผลกระทบ',
    'room.flag_status': 'สถานะธง',
    'room.pending': 'รอดำเนินการ',
    'room.captured': 'พิชิตสำเร็จแล้ว',
    'room.start_investigation': 'เริ่มการตรวจสอบปัญหา',
    'room.open_lab': 'เปิดห้องทดลองเครือข่าย',
    'room.download_lab': 'ดาวน์โหลดไฟล์แล็บ',
    'room.open_instructions': 'เปิดคู่มือการทำแล็บ',
    'room.packet_tracer_notice': 'ข้อกำหนดโปรแกรม: ต้องติดตั้งโปรแกรม Cisco Packet Tracer บนเครื่องของคุณ ดาวน์โหลดไฟล์ .pka ด้านบนแล้วเปิดด้วย Packet Tracer ตรวจสอบการตั้งค่าอุปกรณ์ และวิเคราะห์หาสาเหตุตามโจทย์',
    'room.step_objectives': 'ขั้นตอนแนวทางการตรวจสอบแบบทีละขั้น',
    'room.simulated_cli': 'จำลองหน้าต่างคำสั่ง Cisco IOS CLI',
    'room.hints_title': 'คำใบ้สำหรับการตรวจสอบ',
    'room.hints_desc': 'การเปิดอ่านคำใบ้จะมีการหักคะแนน XP ตามระดับความช่วยเหลือ',
    'room.available_xp': 'XP ที่จะได้รับ',
    'room.submit_answer': 'ส่งคำตอบ',
    'room.correct': 'ถูกต้อง! ยืนยันผลการวิเคราะห์สำเร็จ',
    'room.incorrect': 'คำตอบยังไม่ถูกต้อง ลองตรวจสอบอีกครั้ง',
    'room.root_cause': 'สาเหตุที่แท้จริงของปัญหา',
    'room.mission_complete': 'ปฏิบัติภารกิจสำเร็จ',
    'room.mission_complete_sub': 'คุณได้ตรวจสอบและแก้ไขเหตุขัดข้องของเครือข่ายสำเร็จเรียบร้อยแล้ว',
    'room.submit_flag': 'ส่งค่า Flag',
    'room.next_mission': 'ไปภารกิจถัดไป',
    'room.paste_flag': 'วางรหัส Flag ที่ค้นพบ',

    // Packet Tracer Page
    'pt.title': 'คลังไฟล์แล็บ Cisco Packet Tracer',
    'pt.subtitle': 'ดาวน์โหลดกิจกรรม .PKA เพื่อลงมือปฏิบัติการจริงบนคอมพิวเตอร์ของคุณ',
    'pt.instructions_title': 'ขั้นตอนการฝึกฝนด้วยไฟล์จำลอง Packet Tracer',
    'pt.instructions_desc': '1. ดาวน์โหลดไฟล์ .pka ประจำภารกิจ 2. เปิดไฟล์ในโปรแกรม Cisco Packet Tracer 3. ตรวจสอบการกำหนดค่าที่ผิดพลาดในระบบเครือข่าย 4. กลับมาตอบคำถามและส่งรหัส Flag ในเว็บแอปพลิเคชัน',
    'pt.get_pt': 'ดาวน์โหลดโปรแกรม Packet Tracer',
    'pt.download_pka': 'ดาวน์โหลด .PKA',
    'pt.open_room': 'เข้าสู่ภารกิจ',

    // Leaderboard
    'lb.title': 'ตารางจัดอันดับ Network CTF',
    'lb.subtitle': 'จัดอันดับผู้เรียนที่มีความเชี่ยวชาญสูงสุด พิจารณาจากจำนวนธงที่ชิงได้ ความเร็ว และคะแนน XP สะสม',
    'lb.rank': 'อันดับ',
    'lb.cadet': 'วิศวกร / นักศึกษา',
    'lb.level': 'เลเวล',
    'lb.flags': 'ธงที่ได้',
    'lb.missions': 'ภารกิจ',
    'lb.xp': 'XP รวม',
    'lb.you': 'คุณ',
    'lb.all_time': 'ตลอดเวลา',

    // Achievements
    'ach.title': 'เหรียญเกียรติยศและความสำเร็จ',
    'ach.subtitle': 'รับเหรียญรางวัลเมื่อผ่านเป้าหมายสำคัญ ความแม่นยำในการแก้ปัญหา และความเชี่ยวชาญ',
    'ach.unlocked_badges': 'เหรียญรางวัลที่ปลดล็อกแล้ว',

    // Profile
    'prof.capstone_title': 'ผลการประเมินทักษะสำหรับงานวิจัยปริญญานิพนธ์',
    'prof.capstone_sub': 'เปรียบเทียบผลสัมฤทธิ์ทางการเรียนรู้ก่อนและหลังฝึกอบรม',
    'prof.baseline_pre': 'คะแนนก่อนเรียน',
    'prof.post_training': 'คะแนนหลังเรียน',
    'prof.measured_growth': 'พัฒนาการที่เพิ่มขึ้น',
    'prof.open_assessment': 'เปิดศูนย์ทำแบบทดสอบ',

    // Assessment
    'assess.title': 'ศูนย์แบบทดสอบก่อนเรียนและหลังเรียน',
    'assess.subtitle': 'เครื่องมือวัดผลสัมฤทธิ์การเรียนรู้มาตรฐาน เพื่อประเมินประสิทธิภาพของระบบจำลองการเรียนรู้แบบ CTF',
    'assess.pretest_tab': 'ทำแบบทดสอบก่อนเรียน',
    'assess.posttest_tab': 'ทำแบบทดสอบหลังเรียน',
    'assess.submit': 'ส่งผลแบบทดสอบ',
    'assess.score': 'คะแนนที่ได้',
    'assess.success_msg': 'ส่งแบบทดสอบเรียบร้อยแล้ว!',
    'assess.growth': 'พัฒนาการการเรียนรู้'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('network_ctf_lang');
    return (saved === 'en' || saved === 'th') ? saved : 'th'; // Default to Thai for Thai university capstone
  });

  useEffect(() => {
    document.documentElement.lang = language === 'th' ? 'th' : 'en';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('network_ctf_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  const t = (key: string): string => {
    const langDict = translations[language] || translations.en;
    return langDict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
