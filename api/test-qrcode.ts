/** Diagnostic — import qrcode saja. */
import QRCode from "qrcode";

export default (req, res) => {
  res.status(200).json({ ok: true, qrcode: typeof QRCode.toDataURL });
};
