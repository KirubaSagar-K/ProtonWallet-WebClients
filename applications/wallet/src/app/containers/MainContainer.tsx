import { Route, Switch } from 'react-router-dom';

import { useActiveBreakpoint } from '@proton/components';
import ContactEmailsProvider from '@proton/components/containers/contacts/ContactEmailsProvider';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';

import { PrivateWalletLayout } from '../components';
import { ResponsiveContainerContextProvider } from '../contexts/ResponsiveContainerContext/ResponsiveContainerContextProvider';
import { AccountContainer } from './AccountContainer';
import { DiscoverContainer } from './DiscoverContainer';
import { EmptyViewContainer } from './EmptyViewContainer';
import { LockedWalletContainer } from './LockedWalletContainer';
import { WalletContainer } from './WalletContainer';

const MainContainer = () => {
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <QuickSettingsRemindersProvider>
            <ContactEmailsProvider>
                <ResponsiveContainerContextProvider isNarrow={!viewportWidth['>=large']}>
                    <Switch>
                        <Route exact path={'/wallets/:walletId/accounts/:accountId'}>
                            <PrivateWalletLayout>
                                <AccountContainer />
                            </PrivateWalletLayout>
                        </Route>

                        <Route exact path={'/wallets/:walletId/locked'}>
                            <PrivateWalletLayout>
                                <LockedWalletContainer />
                            </PrivateWalletLayout>
                        </Route>

                        <Route exact path={'/wallets/:walletId'}>
                            <PrivateWalletLayout>
                                <WalletContainer />
                            </PrivateWalletLayout>
                        </Route>

                        <Route exact path={'/discover'}>
                            <PrivateWalletLayout>
                                <DiscoverContainer />
                            </PrivateWalletLayout>
                        </Route>

                        <Route>
                            <PrivateWalletLayout>
                                <EmptyViewContainer />
                            </PrivateWalletLayout>
                        </Route>
                    </Switch>
                </ResponsiveContainerContextProvider>
            </ContactEmailsProvider>
        </QuickSettingsRemindersProvider>
    );
};

export default MainContainer;
