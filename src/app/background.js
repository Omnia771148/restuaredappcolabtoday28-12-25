
// Listen for the 'setRestId' event from the main app
addEventListener('setRestId', async (resolve, reject, args) => {
    try {
        if (args.restId) {
            // Save to native KV storage so it survives app kill
            await CapacitorKV.set('restId', args.restId);
            console.log('Background: RestID saved', args.restId);
        }
        resolve();
    } catch (err) {
        reject(err);
    }
});

addEventListener('checkOrders', async (resolve, reject, args) => {
    try {
        // 1. Retrieve the saved Rest ID
        const restId = await CapacitorKV.get('restId');

        if (!restId) {
            console.log('Background: No RestID set yet.');
            resolve();
            return;
        }

        const response = await fetch(`https://restuaredappcolabtoday28-12-25.vercel.app/api/orders?restaurantId=${restId}`);
        const data = await response.json();

        if (data.success && data.orders.length > 0) {
            // 2. Here we would normally trigger a notification
            // However, BackgroundRunner is strictly for logic.
            // To show a notification from here, we use the Capacitor Notifications plugin

            // Setup for notification is complex in runner.
            // Usually we just return result and let the main app handle it IF it was awake.
            // BUT since the app is dead, we need a native trigger.

            CapacitorNotifications.schedule({
                notifications: [
                    {
                        title: "New Order (Background Check)",
                        body: "You have orders waiting!",
                        id: 100,
                        sound: 'noti.mp3',
                        schedule: { at: new Date(Date.now() + 1000) }
                    }
                ]
            });
        }
        resolve();
    } catch (err) {
        reject(err);
    }
});
