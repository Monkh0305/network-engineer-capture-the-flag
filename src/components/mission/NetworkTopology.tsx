import React, { useState } from 'react';
import { NetworkTopologyData, TopologyNode } from '../../types';
import { 
  Router as RouterIcon, 
  Server, 
  Monitor, 
  Cloud, 
  Network, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  X,
  Activity,
  Terminal
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface NetworkTopologyProps {
  topology?: NetworkTopologyData;
  missionTitle: string;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  topology,
  missionTitle
}) => {
  const { language } = useLanguage();
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  if (!topology || !topology.nodes || topology.nodes.length === 0) {
    return (
      <div className="p-8 text-center bg-[#111820] border border-[#263241] rounded-lg text-[#8D9BA8]">
        {language === 'th' ? 'ยังไม่มีแผนผังเครือข่ายสำหรับสถานการณ์นี้' : 'No topology layout defined for this scenario.'}
      </div>
    );
  }

  const getNodeIcon = (type: TopologyNode['type']) => {
    switch (type) {
      case 'router': return <RouterIcon className="w-6 h-6 text-[#00C2FF]" />;
      case 'switch': return <Network className="w-6 h-6 text-[#F5C542]" />;
      case 'server': return <Server className="w-6 h-6 text-[#9B51E0]" />;
      case 'pc': return <Monitor className="w-6 h-6 text-[#2ECC71]" />;
      case 'cloud': return <Cloud className="w-6 h-6 text-[#00C2FF]" />;
      default: return <Monitor className="w-6 h-6 text-[#8D9BA8]" />;
    }
  };

  const getStatusBadge = (status: TopologyNode['status']) => {
    switch (status) {
      case 'online':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#2ECC71] bg-[#2ECC71]/10 px-1.5 py-0.5 rounded border border-[#2ECC71]/30">
            <CheckCircle2 className="w-3 h-3" /> {language === 'th' ? 'ออนไลน์' : 'ONLINE'}
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#FF5252] bg-[#FF5252]/10 px-1.5 py-0.5 rounded border border-[#FF5252]/30 animate-pulse">
            <AlertCircle className="w-3 h-3" /> {language === 'th' ? 'ขัดข้อง' : 'FAULT'}
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#F5C542] bg-[#F5C542]/10 px-1.5 py-0.5 rounded border border-[#F5C542]/30">
            <Activity className="w-3 h-3" /> {language === 'th' ? 'ผิดปกติ' : 'ANOMALY'}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-[#8D9BA8] bg-[#8D9BA8]/10 px-1.5 py-0.5 rounded border border-[#8D9BA8]/30">
            <HelpCircle className="w-3 h-3" /> {language === 'th' ? 'ไม่ทราบสถานะ' : 'UNKNOWN'}
          </span>
        );
    }
  };

  return (
    <div id="network-topology-container" className="space-y-4">
      {/* Topology Stage Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#111820] border border-[#263241] rounded-lg">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00C2FF]" />
          <span className="text-xs font-semibold text-[#F4F6F8]">{language === 'th' ? 'แผนผังเครือข่ายแบบโต้ตอบ' : 'Interactive Topology Map'}</span>
          <span className="text-[10px] font-mono text-[#8D9BA8] border-l border-[#263241] pl-2">
            {language === 'th' ? 'เลือกอุปกรณ์เพื่อตรวจสอบข้อมูล' : 'Click any device node to inspect telemetry'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71]"></span>
            <span className="text-[#8D9BA8] text-[11px]">{language === 'th' ? 'ออนไลน์' : 'Online'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5252] animate-ping"></span>
            <span className="text-[#8D9BA8] text-[11px]">{language === 'th' ? 'ขัดข้อง / สูญหาย' : 'Fault / Loss'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5C542]"></span>
            <span className="text-[#8D9BA8] text-[11px]">{language === 'th' ? 'ประสิทธิภาพลดลง' : 'Degraded'}</span>
          </div>
        </div>
      </div>

      {/* SVG & Canvas Topology Board */}
      <div className="relative w-full h-96 bg-[#0B0F14] border border-[#263241] rounded-lg overflow-hidden flex items-center justify-center p-4">
        {/* Subtle Cyber Grid Background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#263241 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        <svg className="w-full h-full absolute inset-0 pointer-events-none">
          {/* Render Links */}
          {topology.links.map((link, idx) => {
            const sourceNode = topology.nodes.find(n => n.id === link.from);
            const targetNode = topology.nodes.find(n => n.id === link.to);
            if (!sourceNode || !targetNode) return null;

            const isDown = link.status === 'down';
            const isWarning = link.status === 'warning';
            const strokeColor = isDown ? '#FF5252' : isWarning ? '#F5C542' : '#263241';
            const strokeDash = isDown ? '4,4' : undefined;

            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;

            return (
              <g key={`link-${idx}`}>
                <line
                  x1={`${sourceNode.x}%`}
                  y1={`${sourceNode.y}%`}
                  x2={`${targetNode.x}%`}
                  y2={`${targetNode.y}%`}
                  stroke={strokeColor}
                  strokeWidth={isDown || isWarning ? 2 : 1.5}
                  strokeDasharray={strokeDash}
                  className={isDown ? 'animate-pulse' : ''}
                />
                {link.label && (
                  <text
                    x={`${midX}%`}
                    y={`${midY - 2}%`}
                    fill={isDown ? '#FF5252' : '#8D9BA8'}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="bg-[#0B0F14] px-1"
                  >
                    {link.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Render Device Nodes */}
        <div className="relative w-full h-full">
          {topology.nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const isError = node.status === 'error';
            const isWarning = node.status === 'warning';

            return (
              <div
                key={node.id}
                id={`topo-node-${node.id}`}
                onClick={() => setSelectedNode(node)}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className={`absolute cursor-pointer group flex flex-col items-center z-10 transition-transform ${
                  isSelected ? 'scale-110' : 'hover:scale-105'
                }`}
              >
                {/* Node Shape */}
                <div 
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-lg relative ${
                    isError 
                      ? 'bg-[#161F29] border-2 border-[#FF5252] shadow-[0_0_15px_rgba(255,82,82,0.3)]' 
                      : isWarning
                      ? 'bg-[#161F29] border-2 border-[#F5C542] shadow-[0_0_15px_rgba(245,197,66,0.3)]'
                      : 'bg-[#161F29] border border-[#263241] hover:border-[#F5C542]'
                  }`}
                >
                  {getNodeIcon(node.type)}
                  
                  {/* Status ping indicator */}
                  <span 
                    className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0B0F14] ${
                      isError ? 'bg-[#FF5252] animate-ping' : isWarning ? 'bg-[#F5C542]' : 'bg-[#2ECC71]'
                    }`}
                  />
                </div>

                {/* Node Label */}
                <div className="mt-1.5 text-center pointer-events-none max-w-[110px]">
                  <div className="text-[11px] font-bold text-[#F4F6F8] truncate">{node.name}</div>
                  <div className="text-[9px] font-mono text-[#8D9BA8] truncate">{node.ip}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Telemetry Drawer */}
      {selectedNode && (
        <div 
          id="node-telemetry-panel"
          className="p-4 bg-[#111820] border border-[#263241] rounded-lg space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-[#263241] pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#161F29] border border-[#263241]">
                {getNodeIcon(selectedNode.type)}
              </div>
              <div>
                <div className="text-xs font-bold text-[#F4F6F8] flex items-center gap-2">
                  <span>{selectedNode.name}</span>
                  {getStatusBadge(selectedNode.status)}
                </div>
                <div className="text-[10px] text-[#8D9BA8] font-mono">
                  {language === 'th' ? 'รหัสอุปกรณ์' : 'Device ID'}: {selectedNode.id} | Layer {selectedNode.type === 'pc' ? '7/3' : selectedNode.type === 'router' ? '3' : '2'} {language === 'th' ? 'อุปกรณ์' : 'Device'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 text-[#8D9BA8] hover:text-[#F4F6F8] rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded bg-[#0B0F14] border border-[#263241]">
              <div className="text-[10px] uppercase text-[#8D9BA8] font-mono">{language === 'th' ? 'ค่า IP / Subnet ที่กำหนด' : 'Configured IP / Subnet'}</div>
              <div className="text-xs font-mono font-semibold text-[#00C2FF] mt-0.5">{selectedNode.ip}</div>
            </div>

            <div className="p-2.5 rounded bg-[#0B0F14] border border-[#263241]">
              <div className="text-[10px] uppercase text-[#8D9BA8] font-mono">{language === 'th' ? 'สถานะการเชื่อมต่อ' : 'Link State'}</div>
              <div className="text-xs font-mono font-semibold text-[#F4F6F8] mt-0.5">
                {selectedNode.status === 'online' ? (language === 'th' ? 'ตรวจพบสัญญาณ: ปกติ, FastEthernet ทำงาน' : 'Carrier Detect: OK, FastEthernet UP') : (language === 'th' ? 'สัญญาณเตือน / ค่า Interface ไม่ตรงกัน' : 'Carrier Alert / Interface Discrepancy')}
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#0B0F14] border border-[#263241]">
              <div className="text-[10px] uppercase text-[#8D9BA8] font-mono">{language === 'th' ? 'ผลการตรวจสอบ' : 'Diagnostic Observation'}</div>
              <div className="text-xs text-[#F5C542] mt-0.5 font-medium">
                {selectedNode.issue || (language === 'th' ? 'ไม่พบความผิดปกติของอุปกรณ์นี้' : 'No anomalous telemetry recorded on this node.')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
