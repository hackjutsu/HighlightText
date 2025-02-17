const ErrorTracker = {
    track: async function(error, context) {
        // Check consent before tracking
        const hasConsent = await this.checkConsent();
        if (!hasConsent) return;

        if (!chrome.runtime.getManifest().version.includes('dev')) {
            const errorData = {
                timestamp: new Date().toISOString(),
                context: context,
                message: this.sanitizeErrorMessage(error.message || 'Unknown error'),
                version: chrome.runtime.getManifest().version
            };

            chrome.storage.local.get(['errorLogs'], (result) => {
                const logs = result.errorLogs || [];
                logs.push({
                    ...errorData,
                    expiryDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days
                });
                
                // Remove expired logs
                const currentLogs = logs.filter(log => new Date(log.expiryDate) > new Date());
                
                // Keep only last 50 unexpired logs
                if (currentLogs.length > 50) currentLogs.shift();
                
                chrome.storage.local.set({ errorLogs: currentLogs });
            });
        }
    },

    checkConsent: function() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['errorTrackingConsent'], (result) => {
                resolve(result.errorTrackingConsent === true);
            });
        });
    },

    sanitizeErrorMessage: function(message) {
        return message.replace(/https?:\/\/[^\s]+/g, '[URL]')
                     .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    },

    export: function() {
        chrome.storage.local.get(['errorLogs'], (result) => {
            const logs = result.errorLogs || [];
            if (logs.length === 0) return;

            const content = JSON.stringify(logs, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `highlighter-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    },

    clear: function() {
        chrome.storage.local.set({ errorLogs: [] });
    }
};