import { useMemo } from 'react';

import { Button } from '@proton/atoms/Button';
import { useModalStateObject } from '@proton/components/components';
import { usePassAliasesContext } from '@proton/components/components/drawer/views/SecurityCenter/PassAliases/PassAliasesProvider';
import CreatePassAliasesForm from '@proton/components/components/drawer/views/SecurityCenter/PassAliases/modals/CreatePassAliasesForm/CreatePassAliasesForm';
import PassAliasesUpsellModal from '@proton/components/components/drawer/views/SecurityCenter/PassAliases/modals/PassAliasesUpsellModal';
import { useAuthentication } from '@proton/components/hooks';
import { encodeFilters } from '@proton/pass/components/Navigation/routing';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

interface Props {
    ctaText: string;
}

const PassAliasTipCTA = ({ ctaText }: Props) => {
    const { hasReachedAliasesCountLimit } = usePassAliasesContext();

    const authentication = useAuthentication();

    const passAliasesURL = useMemo(() => {
        const search = new URLSearchParams();
        search.set(
            'filters',
            encodeFilters({
                type: 'alias',
                sort: 'recent',
                selectedShareId: null,
                search: '',
            })
        );

        return getAppHref(`?${search.toString()}`, APPS.PROTONPASS, authentication?.getLocalID?.());
    }, []);

    const passAliasesUpsellModal = useModalStateObject();
    const createPassAliasesForm = useModalStateObject();

    const onClick = () => {
        if (hasReachedAliasesCountLimit) {
            passAliasesUpsellModal.openModal(true);
        } else {
            createPassAliasesForm.openModal(true);
        }
    };

    return (
        <>
            {passAliasesUpsellModal.render && <PassAliasesUpsellModal modalProps={passAliasesUpsellModal.modalProps} />}
            {createPassAliasesForm.render && (
                <CreatePassAliasesForm
                    onSubmit={() => {
                        createPassAliasesForm.openModal(false);
                    }}
                    passAliasesURL={passAliasesURL}
                    modalProps={createPassAliasesForm.modalProps}
                />
            )}
            <Button onClick={onClick} shape="underline" size="small" className="link align-baseline py-0">
                {ctaText}
            </Button>
        </>
    );
};

export default PassAliasTipCTA;
