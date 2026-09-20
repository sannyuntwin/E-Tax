export interface LicenseData {
    license_key: string;
    license_type: string;
    status: string;
    expires_at?: string;
    max_users: number;
    max_invoices: number;
    max_api_keys: number;
    features: string[];
    validation_count: number;
    last_validated?: string;
}

const STORAGE_KEYS = {
    LICENSE: 'etax_license_data',
    MACHINE_ID: 'etax_machine_id',
};

/**
 * Gets or generates a unique machine ID for the current browser session.
 */
export const getMachineId = (): string => {
    if (typeof window === 'undefined') return 'server-side';

    let machineId = localStorage.getItem(STORAGE_KEYS.MACHINE_ID);
    if (!machineId) {
        // Generate a simple unique ID
        machineId = 'etax-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
        localStorage.setItem(STORAGE_KEYS.MACHINE_ID, machineId);
    }
    return machineId;
};

/**
 * Stores license data locally for offline use and faster access.
 */
export const storeLicense = (data: LicenseData): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.LICENSE, JSON.stringify(data));
};

/**
 * Retrieves the locally stored license data.
 */
export const getCachedLicense = (): LicenseData | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEYS.LICENSE);
    if (!data) return null;
    try {
        return JSON.parse(data) as LicenseData;
    } catch (e) {
        console.error('Failed to parse cached license:', e);
        return null;
    }
};

/**
 * Clears the locally stored license data.
 */
export const clearLicense = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.LICENSE);
};

/**
 * Checks if a specific feature is enabled based on the current license.
 */
export const hasFeature = (featureName: string): boolean => {
    const license = getCachedLicense();
    if (!license || license.status !== 'active') return false;

    // Basic perpetual features if not explicitly listed but license is active
    const defaultFeatures = ['basic_invoicing'];

    return license.features.includes(featureName) || defaultFeatures.includes(featureName);
};

/**
 * Checks if the license is valid and active.
 */
export const isLicenseActive = (): boolean => {
    const license = getCachedLicense();
    if (!license) return false;
    if (license.status !== 'active') return false;

    if (license.expires_at) {
        const expiryDate = new Date(license.expires_at);
        return expiryDate > new Date();
    }

    return true;
};
