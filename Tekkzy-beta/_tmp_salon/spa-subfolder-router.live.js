function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Ignore requests for files (assets, html, json, etc.)
    var lastPart = uri.substring(uri.lastIndexOf('/') + 1);
    if (lastPart.includes('.')) {
        return request;
    }

    // Root application
    if (uri === '/' || uri === '') {
        request.uri = '/index.html';
        return request;
    }

    var apps = [
        'lawyer1',
        'investor1',
        'designer1',
        'education1',
        'education2',
        'education3',
        'enterprise1',
        'enterprise2',
        'enterprise3',
        'cafe1',
        'resort1',
        'resort001',
        'salon1',
        'salon001',
        'eye-clinic1',
    ];

    // Next.js / static multipage exports — keep nested routes
    // (/salon001/contact → /salon001/contact/index.html), do not collapse to app root.
    var multipageApps = {
        salon1: true,
        salon001: true,
    };

    var parts = uri.split('/').filter(Boolean);

    if (parts.length > 0 && apps.includes(parts[0])) {
        if (multipageApps[parts[0]]) {
            if (parts.length === 1) {
                request.uri = '/' + parts[0] + '/index.html';
            } else {
                request.uri = '/' + parts.join('/') + '/index.html';
            }
        } else {
            // Vite / SPA templates — always serve the app shell
            request.uri = '/' + parts[0] + '/index.html';
        }
    }

    return request;
}
