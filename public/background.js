
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

        // DEBUG: Notify that job started (Remove this later)
        /*
        CapacitorNotifications.schedule({
            notifications: [{
                title: "Debug: Job Started",
                body: "Checking for orders...",
                id: 900,
                schedule: { at: new Date(Date.now() + 100) },
                channelId: 'default'
            }]
        });
        */

        const response = await fetch(`https://restuaredappcolabtoday28-12-25.vercel.app/api/orders?restaurantId=${restId}`);
        const data = await response.json();

        // DEBUG: Notify fetch success (Remove later)
        /*
        CapacitorNotifications.schedule({
            notifications: [{
                title: "Debug: Fetch OK",
                body: `Orders: ${data.orders ? data.orders.length : 0}`,
                id: 901,
                schedule: { at: new Date(Date.now() + 100) },
                channelId: 'default'
            }]
        });
        */

        if (data.success && data.orders.length > 0) {
            CapacitorNotifications.schedule({
                notifications: [
                    {
                        title: "New Order (Background)",
                        body: "New order received! Open app.",
                        id: 100,
                        schedule: { at: new Date(Date.now() + 100) },
                        sound: 'noti.mp3',
                        channelId: 'default',
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
        }
        resolve();
    } catch (err) {
        // DEBUG: Notify Error
        CapacitorNotifications.schedule({
            notifications: [{
                title: "Debug: Error",
                body: JSON.stringify(err),
                id: 999,
                schedule: { at: new Date(Date.now() + 100) },
                channelId: 'default'
            }]
        });
        reject(err);
    }
});
