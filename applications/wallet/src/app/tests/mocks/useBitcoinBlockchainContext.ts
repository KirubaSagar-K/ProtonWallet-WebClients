import { WasmNetwork } from '@proton/andromeda';

import { getFeesEstimationMap, mockedWalletChainDataByWalletId } from '..';
import * as useBitcoinBlockchainContextModule from '../../contexts/BitcoinBlockchainContext';
import { apiWalletsData } from '../fixtures/api';

export const mockUseBitcoinBlockchainContext = (
    mockedValue?: Partial<ReturnType<typeof useBitcoinBlockchainContextModule.useBitcoinBlockchainContext>>
) => {
    const spy = vi.spyOn(useBitcoinBlockchainContextModule, 'useBitcoinBlockchainContext');

    spy.mockReturnValue({
        network: WasmNetwork.Testnet,

        walletsChainData: mockedWalletChainDataByWalletId,
        accountIDByDerivationPathByWalletID: {},
        syncingMetatadaByAccountId: {},
        syncSingleWalletAccount: vi.fn(),
        syncSingleWallet: vi.fn(),
        syncManyWallets: vi.fn(),

        decryptedApiWalletsData: apiWalletsData,
        loadingApiWalletsData: false,
        setPassphrase: vi.fn(),

        feesEstimation: getFeesEstimationMap(),
        loadingFeesEstimation: false,

        ...mockedValue,
    });

    return spy;
};
