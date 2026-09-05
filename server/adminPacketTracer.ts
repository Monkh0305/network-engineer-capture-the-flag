import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router, type Request, type Response } from 'express';
import multer, { MulterError } from 'multer';
import { logActivity } from './activity.ts';
import { getAuthenticatedUser } from './auth.ts';
import { db } from './db.ts';

export const MAX_PACKET_TRACER_FILE_SIZE = 25 * 1024 * 1024;
export const packetTracerStorageDirectory = path.resolve(process.cwd(), 'storage', 'packet-tracer-labs');
fs.mkdirSync(packetTracerStorageDirectory, { recursive: true });

interface StoredLabRow {
  id: number;
  mission_id: number;
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  updated_at: string;
}

const allowedExtensions = new Set(['.pkt', '.pka']);
const allowedMimeTypes = new Set([
  'application/octet-stream',
  'application/x-cisco-packet-tracer',
  'application/vnd.cisco.packet-tracer',
  'application/vnd.cisco.packet-tracer-activity',
]);

function validateOriginalFilename(filename: string): string | null {
  if (!filename || filename.length > 180) return 'Filename must contain 1-180 characters';
  if (filename.includes('\0') || /[\\/]/.test(filename) || path.basename(filename) !== filename) return 'Invalid filename path';
  if (/^[. ]|[. ]$/.test(filename) || /[\x00-\x1f<>:"|?*]/.test(filename)) return 'Filename contains unsafe characters';
  if (!allowedExtensions.has(path.extname(filename).toLowerCase())) return 'Only .pkt and .pka files are allowed';
  return null;
}

function resolveStoredPath(storedFilename: string): string | null {
  if (!/^[a-f0-9-]{36}\.(pkt|pka)$/.test(storedFilename)) return null;
  const resolved = path.resolve(packetTracerStorageDirectory, storedFilename);
  return path.dirname(resolved) === packetTracerStorageDirectory ? resolved : null;
}

export function deleteStoredLabFile(storedFilename: string | null | undefined): void {
  if (!storedFilename) return;
  const filePath = resolveStoredPath(storedFilename);
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, packetTracerStorageDirectory),
  filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
  storage,
  preservePath: true,
  limits: { fileSize: MAX_PACKET_TRACER_FILE_SIZE, files: 1, fields: 4 },
  fileFilter: (_req, file, callback) => {
    const filenameError = validateOriginalFilename(file.originalname);
    if (filenameError) return callback(new Error(filenameError));
    if (!allowedMimeTypes.has(file.mimetype.toLowerCase())) return callback(new Error('Unsupported Packet Tracer MIME type'));
    callback(null, true);
  },
});

function runUpload(req: Request, res: Response, next: () => void): void {
  upload.single('file')(req, res, (error: unknown) => {
    if (!error) return next();
    if (error instanceof MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: `File is too large. Maximum size is ${MAX_PACKET_TRACER_FILE_SIZE / 1024 / 1024} MB` });
      return;
    }
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid upload' });
  });
}

export function getStoredLabForMission(missionId: number): StoredLabRow | undefined {
  return db.prepare('SELECT * FROM packet_tracer_labs WHERE mission_id = ?').get(missionId) as unknown as StoredLabRow | undefined;
}

export function sendStoredLab(res: Response, lab: StoredLabRow): boolean {
  const filePath = resolveStoredPath(lab.stored_filename);
  if (!filePath || !fs.existsSync(filePath)) return false;
  res.download(filePath, lab.original_filename);
  return true;
}

export const adminPacketTracerRouter = Router();

adminPacketTracerRouter.get('/', (_req, res) => {
  try {
    const labs = db.prepare(`
      SELECT m.id AS missionId, m.mission_number AS missionNumber, m.title AS missionTitle,
        m.status AS missionStatus, m.packet_tracer_file AS legacyFilename,
        lab.id, lab.original_filename AS filename, lab.mime_type AS mimeType,
        lab.file_size AS fileSize, lab.uploaded_at AS uploadedAt, lab.updated_at AS updatedAt
      FROM missions m
      LEFT JOIN packet_tracer_labs lab ON lab.mission_id = m.id
      ORDER BY m.order_index, m.id
    `).all() as unknown as Array<Record<string, unknown>>;
    res.json({
      labs: labs.map((lab) => ({
        ...lab,
        filename: lab.filename || lab.legacyFilename || null,
        isManaged: Boolean(lab.id),
      })),
      maxFileSize: MAX_PACKET_TRACER_FILE_SIZE,
      allowedExtensions: [...allowedExtensions],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminPacketTracerRouter.post('/upload', runUpload, (req, res) => {
  const file = req.file;
  const missionId = Number(req.body.missionId);
  const cleanupNewFile = () => deleteStoredLabFile(file?.filename);
  try {
    if (!file) return res.status(400).json({ error: 'Packet Tracer file is required' });
    if (!Number.isInteger(missionId) || missionId <= 0) {
      cleanupNewFile();
      return res.status(400).json({ error: 'A valid mission is required' });
    }
    const mission = db.prepare('SELECT id FROM missions WHERE id = ?').get(missionId);
    if (!mission) {
      cleanupNewFile();
      return res.status(404).json({ error: 'Mission not found' });
    }

    const existing = getStoredLabForMission(missionId);
    const now = new Date().toISOString();
    db.exec('BEGIN');
    try {
      db.prepare(`
        INSERT INTO packet_tracer_labs (
          mission_id, original_filename, stored_filename, mime_type, file_size, uploaded_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(mission_id) DO UPDATE SET
          original_filename=excluded.original_filename,
          stored_filename=excluded.stored_filename,
          mime_type=excluded.mime_type,
          file_size=excluded.file_size,
          uploaded_at=excluded.uploaded_at,
          updated_at=excluded.updated_at
      `).run(missionId, file.originalname, file.filename, file.mimetype, file.size, now, now);
      db.prepare('UPDATE missions SET packet_tracer_file = ?, updated_at = ? WHERE id = ?').run(file.originalname, now, missionId);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }

    if (existing?.stored_filename !== file.filename) deleteStoredLabFile(existing?.stored_filename);
    const user = getAuthenticatedUser(req);
    logActivity(user.id, existing ? 'PACKET_TRACER_REPLACED' : 'PACKET_TRACER_UPLOADED', 'mission', missionId, {
      filename: file.originalname,
      fileSize: file.size,
    });
    logActivity(user.id, 'ADMIN_FILE_UPLOADED', 'mission', missionId, { filename: file.originalname });
    res.status(existing ? 200 : 201).json({ lab: getStoredLabForMission(missionId), replaced: Boolean(existing) });
  } catch (error: any) {
    cleanupNewFile();
    res.status(500).json({ error: error.message });
  }
});

adminPacketTracerRouter.get('/:missionId/download', (req, res) => {
  const missionId = Number(req.params.missionId);
  const lab = getStoredLabForMission(missionId);
  if (!lab) return res.status(404).json({ error: 'Uploaded lab file not found' });
  if (!sendStoredLab(res, lab)) return res.status(410).json({ error: 'Stored lab file is missing' });
});

adminPacketTracerRouter.delete('/:missionId', (req, res) => {
  const missionId = Number(req.params.missionId);
  const lab = getStoredLabForMission(missionId);
  if (!lab) return res.status(404).json({ error: 'Uploaded lab file not found' });
  try {
    db.exec('BEGIN');
    db.prepare('DELETE FROM packet_tracer_labs WHERE mission_id = ?').run(missionId);
    db.prepare("UPDATE missions SET packet_tracer_file = '', updated_at = ? WHERE id = ?").run(new Date().toISOString(), missionId);
    db.exec('COMMIT');
    deleteStoredLabFile(lab.stored_filename);
    const user = getAuthenticatedUser(req);
    logActivity(user.id, 'PACKET_TRACER_REMOVED', 'mission', missionId, { filename: lab.original_filename });
    res.json({ success: true });
  } catch (error: any) {
    try { db.exec('ROLLBACK'); } catch {}
    res.status(500).json({ error: error.message });
  }
});
