import { jsPDF } from 'jspdf';
const doc = new jsPDF('p', 'mm', 'a4');
console.log('doc.internal.pageSize keys:', Object.keys(doc.internal.pageSize));
console.log('doc.internal.pageSize.getWidth type:', typeof (doc.internal.pageSize as any).getWidth);
console.log('doc.internal.pageSize.width:', (doc.internal.pageSize as any).width);
