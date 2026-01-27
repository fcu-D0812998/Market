import { Button, Card, Descriptions, Divider, Space, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { getOrder, type Order } from '../lib/api';
import { formatTwd } from '../lib/money';

export function CompletePage() {
  const { orderNo } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>((location.state as Order | null) ?? null);

  useEffect(() => {
    void (async () => {
      if (order) return;
      if (!orderNo) return;
      try {
        const data = await getOrder(orderNo);
        setOrder(data);
      } catch (e) {
        message.error('載入訂單資訊失敗');
      }
    })();
  }, [order, orderNo]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        下單完成
      </Typography.Title>

      <Card>
        <Typography.Paragraph style={{ marginTop: 0 }}>
          我們已收到你的訂單。請依下方資訊完成轉帳，完成後請點擊按鈕前往 LINE 官方帳號與客服聯繫。
        </Typography.Paragraph>
        <Divider />
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="訂單編號">{order?.order_no ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="轉帳金額">{order?.transfer ? formatTwd(order.transfer.amount) : '-'}</Descriptions.Item>
          <Descriptions.Item label="銀行名稱/代碼">{order?.transfer?.bank_name_code ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="帳號">{order?.transfer?.bank_account ?? '-'}</Descriptions.Item>
        </Descriptions>

        <Divider />
        <Button type="primary" size="large" href={order?.line?.chat_url ?? 'https://line.me/R/ti/p/@032emqnn'} target="_blank">
          開啟 LINE 聊天
        </Button>
      </Card>
    </Space>
  );
}


