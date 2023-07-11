import { updateConnection } from 'warehouse';
import { discordClientId, identityUrl } from '$lib/env/public';
import { discordClientSecret } from '$lib/env/private';
import type { Connection } from '@prisma/client';
import type { ServiceProfile } from '$lib/utils';

type ExchangeTokensResponse = {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
};

type CurrentAuthorizationResponse = {
	application: {
		id: string;
		name: string;
		icon: string;
		description: string;
		hook: boolean;
		bot_public: boolean;
		bot_require_code_grant: boolean;
		verify_key: string;
	};
	scopes: string[];
	expires: Date;
	user: {
		id: string;
		username: string;
		avatar: string;
		discriminator: string;
		public_flags: number;
	};
};

type ProfileResponse = {
	id: string;
	username: string;
	global_name: string;
	avatar: string;
	discriminator: string;
	public_flags: number;
	flags: number;
	banner: string;
	banner_color: string;
	accent_color: number;
	locale: string;
	mfa_enabled: boolean;
	premium_type: number;
	avatar_decoration: any;
	email: string;
	verified: boolean;
};

const discordBaseUrl = 'https://discord.com/api';

const isConnectionExpired = (connection: Connection): boolean => {
	const currentDate = new Date();
	return connection.expiresAt < currentDate;
};

export const exchangeTokens = async (code: string): Promise<ExchangeTokensResponse | null> => {
	const body = new URLSearchParams();
	body.append('client_id', discordClientId);
	body.append('client_secret', discordClientSecret);
	body.append('grant_type', 'authorization_code');
	body.append('code', code);
	body.append('redirect_uri', `${identityUrl}/auth/discord`);

	try {
		const resp = await fetch(`${discordBaseUrl}/oauth2/token`, {
			method: 'POST',
			body,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});
		const data = await resp.json();
		return !data.error ? data : null;
	} catch (e) {
		return null;
	}
};

export const refreshAccessToken = async (
	refreshToken: string
): Promise<ExchangeTokensResponse | null> => {
	const body = new URLSearchParams();
	body.append('client_id', discordClientId);
	body.append('client_secret', discordClientSecret);
	body.append('grant_type', 'refresh_token');
	body.append('refresh_token', refreshToken);

	console.log({ body });

	try {
		const resp = await fetch(`${discordBaseUrl}/oauth2/token`, {
			method: 'POST',
			body,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});
		const data = await resp.json();
		return !data.error ? data : null;
	} catch (e) {
		console.log('refresh fail');
		console.log(e);
		return null;
	}
};

export const getCurrentAuthorization = async (
	accessToken: string
): Promise<CurrentAuthorizationResponse | null> => {
	try {
		const resp = await fetch(`${discordBaseUrl}/oauth2/@me`, {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});
		const data = await resp.json();
		return !data.error ? data : null;
	} catch (e) {
		return null;
	}
};

export const getDiscordProfile = async (
	connection: Connection
): Promise<ProfileResponse | null> => {
	console.log({ connection });
	if (connection.service != 'DISCORD') return null;

	let accessToken = connection.accessToken;
	console.log({ isConnectionExpired: isConnectionExpired(connection) });
	if (isConnectionExpired(connection)) {
		console.log('it is expired');
		const tokens = await refreshAccessToken(connection.refreshToken);
		console.log({ tokens });
		if (!tokens) return null;
		accessToken = tokens.access_token;
		await updateConnection(connection.id, tokens);
	}

	try {
		const resp = await fetch(`${discordBaseUrl}/v10/users/@me`, {
			headers: {
				Authorization: `${connection.tokenType} ${accessToken}`
			}
		});
		const data = await resp.json();
		console.log({ data });
		return !data.error ? data : null;
	} catch (e) {
		console.log('/v10/users/@me fail');
		console.log(e);
		return null;
	}
};

export const getPublicDiscordProfile = async (
	connection: Connection
): Promise<ServiceProfile | null> => {
	const profile = await getDiscordProfile(connection);
	console.log({ profile });
	if (!profile) return null;
	return {
		username: profile.global_name,
		avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${
			profile.avatar.startsWith('a_') ? 'gif' : 'png'
		}`,
		url: `https://discord.com/users/${profile.id}`
	};
};
