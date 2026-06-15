import type { Notice } from '@/types';

export const mockNotices: Notice[] = [
  {
    id: '1',
    title: '工具借用须知',
    content: '请在预约后24小时内到物业前台取件，逾期未取预约将自动取消。归还时请保持工具完好，如有损坏需照价赔偿。',
    type: 'announcement',
    createdAt: '2026-06-01T09:00:00Z',
    isTop: true,
  },
  {
    id: '2',
    title: 'FAQ: 押金如何退还？',
    content: '归还工具经物业检查无损后，押金将在1-3个工作日内原路退回您的账户余额。如有损坏，将根据损失程度扣除相应押金。',
    type: 'faq',
    createdAt: '2026-06-05T10:30:00Z',
    isTop: false,
  },
  {
    id: '3',
    title: '新增登高设备安全使用规定',
    content: '即日起，所有登高设备（梯子、脚手架）使用前必须接受物业安全指导，使用时需佩戴安全帽，严禁单人操作超过3米高度的作业。',
    type: 'announcement',
    createdAt: '2026-06-08T14:00:00Z',
    isTop: true,
  },
  {
    id: '4',
    title: 'FAQ: 可以预约多长时间？',
    content: '不同工具最长借用期限不同，电动工具最长3天，登高设备和搬运工具最长1天。如有特殊需要，请联系物业申请延期。',
    type: 'faq',
    createdAt: '2026-06-10T08:00:00Z',
    isTop: false,
  },
  {
    id: '5',
    title: '关于逾期归还的处理说明',
    content: '逾期归还将产生每天押金10%的滞纳金，逾期超过5次将被列入黑名单，无法继续借用工具。请按时归还，维护良好信用。',
    type: 'announcement',
    createdAt: '2026-06-12T16:00:00Z',
    isTop: false,
  },
];
