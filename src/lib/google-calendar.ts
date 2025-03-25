// Google Calendar API integration

// Google OAuth 2.0 configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Track API loading state
let isLoading = false;
let isLoaded = false;
let loadError: Error | null = null;

// Debug function to safely log credential info without exposing full values
const debugCredentials = () => {
  console.log('Environment variables check:');
  console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID exists:', !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  console.log('NEXT_PUBLIC_GOOGLE_API_KEY exists:', !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
  
  const clientIdLength = GOOGLE_CLIENT_ID?.length || 0;
  const apiKeyLength = GOOGLE_API_KEY?.length || 0;
  
  console.log('Credential lengths:', {
    clientId: clientIdLength > 0 ? `${clientIdLength} chars` : 'Empty',
    apiKey: apiKeyLength > 0 ? `${apiKeyLength} chars` : 'Empty'
  });
  
  if (clientIdLength > 0) {
    console.log('Client ID prefix:', GOOGLE_CLIENT_ID.substring(0, 8) + '...');
  }
  
  if (apiKeyLength > 0) {
    console.log('API Key prefix:', GOOGLE_API_KEY.substring(0, 4) + '...');
  }

  // Log the current hostname to help with debugging authorized origins
  if (isBrowser) {
    console.log('Current hostname:', window.location.hostname);
    console.log('Full origin:', window.location.origin);
  }
};

// Load the Google API client library
export const loadGoogleCalendarApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isBrowser) {
      const error = new Error('Google Calendar API can only be loaded in browser environment');
      loadError = error;
      reject(error);
      return;
    }
    
    // Debug credential information
    debugCredentials();
    
    // Validate credentials
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.trim() === '') {
      const error = new Error('Google Calendar API Client ID is not configured');
      console.error('Missing Google Client ID');
      console.error('Please check your .env.local file and make sure NEXT_PUBLIC_GOOGLE_CLIENT_ID is set correctly');
      loadError = error;
      reject(error);
      return;
    }
    
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY.trim() === '') {
      const error = new Error('Google Calendar API Key is not configured');
      console.error('Missing Google API Key');
      console.error('Please check your .env.local file and make sure NEXT_PUBLIC_GOOGLE_API_KEY is set correctly');
      loadError = error;
      reject(error);
      return;
    }

    // If we're already loading, don't start another load
    if (isLoading) {
      console.log('Google Calendar API is already loading');
      reject(new Error('Google Calendar API is already loading'));
      return;
    }

    // If already loaded, resolve immediately
    if (isLoaded) {
      console.log('Google Calendar API is already loaded');
      resolve();
      return;
    }

    // Reset any previous load errors
    loadError = null;
    isLoading = true;

    console.log('Loading Google Calendar API...');
    
    // Create a more robust script loading function
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolveScript, rejectScript) => {
        console.log(`Loading script: ${src}`);
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log(`Script loaded successfully: ${src}`);
          resolveScript();
        };
        
        script.onerror = (error) => {
          console.error(`Error loading script ${src}:`, error);
          rejectScript(new Error(`Failed to load script: ${src}`));
        };
        
        document.body.appendChild(script);
      });
    };

    // Sequential loading of required scripts and initialization
    loadScript('https://apis.google.com/js/api.js')
      .then(() => {
        console.log('Google API script loaded, loading client...');
        return new Promise<void>((resolveGapi, rejectGapi) => {
          window.gapi.load('client', {
            callback: () => {
              console.log('GAPI client loaded successfully');
              resolveGapi();
            },
            onerror: (error: any) => {
              console.error('Error loading GAPI client:', error);
              rejectGapi(new Error('Failed to load GAPI client'));
            },
            timeout: 10000, // 10 seconds timeout
            ontimeout: () => {
              console.error('Timeout loading GAPI client');
              rejectGapi(new Error('Timeout loading GAPI client'));
            }
          });
        });
      })
      .then(() => {
        console.log('Initializing GAPI client with API key and discovery doc...');
        console.log('API Key length:', GOOGLE_API_KEY.length);
        console.log('Discovery Doc:', DISCOVERY_DOC);
        
        return window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        }).then(() => {
          console.log('GAPI client initialized successfully');
        }).catch((error: any) => {
          console.error('GAPI client initialization error:', error);
          if (error && error.error) {
            console.error('Error details:', error.error);
            if (error.error.status) console.error('Status:', error.error.status);
            if (error.error.message) console.error('Message:', error.error.message);
          }
          throw error;
        });
      })
      .then(() => {
        console.log('Loading Google Identity Services script...');
        return loadScript('https://accounts.google.com/gsi/client');
      })
      .then(() => {
        console.log('Google Identity Services loaded successfully');
        isLoaded = true;
        isLoading = false;
        resolve();
      })
      .catch((error) => {
        console.error('Error in Google Calendar API loading process:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error name:', error.name);
          console.error('Error stack:', error.stack);
        } else {
          console.error('Non-Error object thrown:', typeof error, JSON.stringify(error));
        }
        isLoading = false;
        loadError = error instanceof Error ? error : new Error('Unknown error in Google Calendar API loading process');
        reject(loadError);
      });
  });
};

// Check if the user is signed in to Google
export const isSignedInToGoogle = (): boolean => {
  if (!isBrowser || !isLoaded) {
    return false;
  }
  
  try {
    const tokenClient = window.google?.accounts?.oauth2?.TokenClient;
    const token = localStorage.getItem('gapi-token');
    return !!token && !!tokenClient;
  } catch (error) {
    console.error('Error checking if signed in to Google:', error);
    return false;
  }
};

// Sign in to Google
export const signInToGoogle = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isBrowser) {
      reject(new Error('Google sign-in can only be performed in browser environment'));
      return;
    }
    
    if (!isLoaded) {
      reject(new Error('Google Calendar API must be loaded before signing in'));
      return;
    }
    
    try {
      console.log('Starting Google sign-in process...');
      
      // Get the current origin for the redirect URI
      const origin = window.location.origin;
      // Google OAuth typically expects just the origin as the redirect URI
      const redirectUri = origin;
      
      console.log('Using redirect URI:', redirectUri);
      
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('Token error:', tokenResponse);
            reject(new Error(`Failed to get access token: ${tokenResponse.error}`));
            return;
          }
          
          console.log('Successfully obtained access token');
          localStorage.setItem('gapi-token', JSON.stringify(tokenResponse));
          resolve();
        },
        error_callback: (error: any) => {
          console.error('Error in token client:', error);
          reject(new Error(`OAuth error: ${error.type || 'Unknown'}`));
        },
        redirect_uri: redirectUri
      });
      
      // Prompt the user to select an account and grant consent
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      reject(error instanceof Error ? error : new Error('Unknown error during Google sign-in'));
    }
  });
};

// Sign out from Google
export const signOutFromGoogle = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!isBrowser) {
      resolve();
      return;
    }
    
    try {
      // Clear the token from local storage
      localStorage.removeItem('gapi-token');
      console.log('Successfully signed out from Google');
    } catch (error) {
      console.error('Error during Google sign-out:', error);
    }
    
    resolve();
  });
};

// Get user's Google Calendar list
export const getCalendarList = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    if (!isBrowser) {
      reject(new Error('Google Calendar API can only be used in browser environment'));
      return;
    }
    
    if (!isLoaded) {
      reject(new Error('Google Calendar API must be loaded before accessing calendars'));
      return;
    }
    
    if (!isSignedInToGoogle()) {
      reject(new Error('User must be signed in to Google to access calendars'));
      return;
    }
    
    try {
      console.log('Fetching calendar list...');
      window.gapi.client.calendar.calendarList.list()
        .then((response: any) => {
          console.log('Calendar list fetched successfully');
          const calendars = response.result.items || [];
          resolve(calendars);
        })
        .catch((error: any) => {
          console.error('Error fetching calendar list:', error);
          reject(error);
        });
    } catch (error) {
      console.error('Error accessing calendar list:', error);
      reject(error instanceof Error ? error : new Error('Unknown error accessing calendar list'));
    }
  });
};

// Create calendar events for a route
export const exportRouteToGoogleCalendar = (
  addresses: Array<{
    id: string;
    address: string;
    lat: number;
    lng: number;
    notes?: string;
    time_spent?: number;
  }>,
  routeDate: Date = new Date()
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    if (!isBrowser) {
      reject(new Error('Google Calendar API can only be used in browser environment'));
      return;
    }
    
    if (!isLoaded) {
      reject(new Error('Google Calendar API must be loaded before exporting routes'));
      return;
    }
    
    if (!isSignedInToGoogle()) {
      reject(new Error('User must be signed in to Google to export routes'));
      return;
    }
    
    if (!addresses || addresses.length === 0) {
      reject(new Error('No addresses provided for export'));
      return;
    }
    
    try {
      console.log('Exporting route to Google Calendar...');
      
      // Get the primary calendar
      window.gapi.client.calendar.calendarList.list({
        maxResults: 1,
        showHidden: false,
        minAccessRole: 'owner'
      }).then((response: any) => {
        const calendars = response.result.items || [];
        if (calendars.length === 0) {
          reject(new Error('No calendars found'));
          return;
        }
        
        const primaryCalendar = calendars.find((cal: any) => cal.primary) || calendars[0];
        const calendarId = primaryCalendar.id;
        
        // Create events for each address
        const eventPromises = addresses.map((address, index) => {
          // Calculate event time (1 hour per address, starting from current time)
          const startTime = new Date(routeDate);
          startTime.setHours(startTime.getHours() + index);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + (address.time_spent || 60));
          
          const event = {
            summary: `Visit: ${address.address}`,
            location: address.address,
            description: address.notes || 'Route stop',
            start: {
              dateTime: startTime.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: endTime.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          };
          
          return window.gapi.client.calendar.events.insert({
            calendarId: calendarId,
            resource: event
          });
        });
        
        // Wait for all events to be created
        Promise.all(eventPromises)
          .then((results) => {
            console.log('Successfully exported route to Google Calendar');
            const eventIds = results.map((result: any) => result.result.id);
            resolve(eventIds);
          })
          .catch((error) => {
            console.error('Error creating calendar events:', error);
            reject(error);
          });
      }).catch((error: any) => {
        console.error('Error getting calendar list:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error exporting route to Google Calendar:', error);
      reject(error instanceof Error ? error : new Error('Unknown error exporting route to Google Calendar'));
    }
  });
};

// Add TypeScript interface for the global window object
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}
