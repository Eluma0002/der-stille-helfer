export async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

export function checkAndNotifyExpiring(produkte) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!produkte || produkte.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (localStorage.getItem('notif_last_check') === todayStr) return;
    localStorage.setItem('notif_last_check', todayStr);

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const expiring = produkte.filter(p => {
        if (!p.ablauf) return false;
        const d = new Date(p.ablauf); d.setHours(0, 0, 0, 0);
        const diff = Math.round((d - today) / 86400000);
        return diff >= 0 && diff <= 2;
    });

    if (expiring.length === 0) return;

    const names = expiring.map(p => p.name).slice(0, 4).join(', ');
    const more  = expiring.length > 4 ? ` +${expiring.length - 4} weitere` : '';

    new Notification('Der Stille Helfer', {
        body: `⏰ Bald ablaufend: ${names}${more}`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'expiry-check',
    });
}
