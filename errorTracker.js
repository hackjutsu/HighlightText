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
                version: chrome.runtime.getManifest().version,
                expiryDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days
            };

            chrome.storage.local.get(['errorLogs'], (result) => {
                const logs = result.errorLogs || [];
                
                // Add new log
                logs.push(errorData);
                
                // Clean up expired logs
                const now = new Date();
                const currentLogs = logs.filter(log => {
                    const expiryDate = new Date(log.expiryDate);
                    return expiryDate > now;
                });
                
                // Keep only last 50 unexpired logs
                if (currentLogs.length > 50) {
                    currentLogs.splice(0, currentLogs.length - 50);
                }
                
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
        if (!message) return 'Unknown error';
        
        return message
            // Remove URLs
            .replace(/https?:\/\/[^\s]+/g, '[URL]')
            // Remove email addresses
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
            // Remove IP addresses
            .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
            // Remove file paths
            .replace(/[\/\\]?([a-zA-Z]:\\|~\/|\/).+?(?=\s|$)/g, '[PATH]')
            // Remove query parameters
            .replace(/\?[^\s]+/g, '[QUERY]')
            // Remove numbers that might be sensitive (like ports, IDs)
            .replace(/\b\d{4,}\b/g, '[NUMBER]');
    },

    export: function() {
        chrome.storage.local.get(['errorLogs'], (result) => {
            try {
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
            } catch (error) {
                console.error('Error exporting logs:', error);
            }
        });
    },

    clear: function() {
        chrome.storage.local.set({ errorLogs: [] });
    }
};