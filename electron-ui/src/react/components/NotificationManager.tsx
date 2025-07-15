import React from 'react';
import './NotificationManager.css';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationManagerProps {
  notifications: Notification[];
}

export function NotificationManager({ notifications }: NotificationManagerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="notification-manager">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type} win95-raised`}
        >
          <span className={`win95-icon ${
            notification.type === 'success' ? 'win95-icon-check' :
            notification.type === 'error' ? 'win95-icon-error' :
            'win95-icon-info'
          }`}></span>
          <span className="notification-message">{notification.message}</span>
        </div>
      ))}
    </div>
  );
}