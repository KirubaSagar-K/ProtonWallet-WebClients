import { put, select } from 'redux-saga/effects';

import { decryptCache } from '@proton/pass/lib/cache/decrypt';
import { getCacheKey } from '@proton/pass/lib/cache/keys';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { getOrganization } from '@proton/pass/lib/organization/organization.requests';
import { sanitizeBetaSetting } from '@proton/pass/lib/settings/beta';
import { userStateHydrated } from '@proton/pass/lib/user/user.predicates';
import { getUserData } from '@proton/pass/lib/user/user.requests';
import { stateHydrate } from '@proton/pass/store/actions';
import { migrate } from '@proton/pass/store/migrate';
import type { HydratedUserState } from '@proton/pass/store/reducers';
import type { OrganizationState } from '@proton/pass/store/reducers/organization';
import type { SettingsState } from '@proton/pass/store/reducers/settings';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import { type Maybe, PlanType } from '@proton/pass/types';
import type { EncryptedPassCache, PassCache } from '@proton/pass/types/worker/cache';
import { throwError } from '@proton/pass/utils/fp/throw';
import { partialMerge } from '@proton/pass/utils/object/merge';

/** `allowFailure` defines how we should treat cache decryption errors.
 * If `true` they will be by-passed - else you can pass a custom error
 * generator function that will be triggered */
type HydrateCacheOptions = {
    allowFailure: boolean;
    merge: (existing: State, incoming: State) => State;
    onError?: () => Generator;
};

/** Will try to decrypt the store cache and hydrate the store accordingly. Returns a
 * boolean flag indicating wether hydration happened from cache or not. */
export function* hydrate(config: HydrateCacheOptions, { getCache, getAuthStore, getSettings }: RootSagaOptions) {
    try {
        const authStore = getAuthStore();
        const keyPassword = authStore.getPassword();
        const { allowFailure } = config;

        const encryptedCache: Partial<EncryptedPassCache> = yield getCache();
        const cacheKey: Maybe<CryptoKey> = yield getCacheKey(encryptedCache, authStore);

        const cache: Maybe<PassCache> = cacheKey
            ? yield decryptCache(cacheKey, encryptedCache).catch((err) => (allowFailure ? undefined : throwError(err)))
            : undefined;

        const cachedState = cache?.state ? migrate(cache.state) : undefined;
        const cachedUser = cachedState?.user;
        const snapshot = cache?.snapshot;

        const userState: HydratedUserState = userStateHydrated(cachedUser) ? cachedUser : yield getUserData();

        const user = userState.user;
        const addresses = Object.values(userState.addresses);
        const organization =
            userState.plan.Type === PlanType.business
                ? cachedState?.organization ?? ((yield getOrganization()) as OrganizationState)
                : null;

        /** Note: Settings may have been modified offline, thus they might not align
         * with the cached state settings. Since caching requests cannot be triggered
         * when offline, it's essential to synchronize the initial settings accordingly */
        const settings: Partial<SettingsState> = (yield getSettings()) ?? {};
        settings.locale = cache?.state.settings.locale ?? userState.userSettings?.Locale;
        settings.beta = BUILD_TARGET === 'web' && sanitizeBetaSetting(settings.beta);
        settings.lockTTL = authStore.getLockTTL();
        settings.lockMode = authStore.getLockMode();
        settings.offlineEnabled = Boolean(settings.offlineEnabled && authStore.getOfflineConfig());

        const incoming = { user: userState, settings, organization };
        const currentState: State = yield select();

        const state: State = cachedState
            ? config.merge(currentState, partialMerge(cachedState, incoming))
            : partialMerge(currentState, incoming);

        /** If `keyPassword` is not defined then we may be dealing with an offline
         * state hydration in which case hydrating PassCrypto would throw. In such
         * cases, wait for network online in order to resume session */
        if (keyPassword) yield PassCrypto.hydrate({ user, keyPassword, addresses, snapshot, clear: true });

        yield put(stateHydrate(state));
        return cache?.state !== undefined && cache?.snapshot !== undefined;
    } catch {
        yield config.onError?.();
        return false;
    }
}
