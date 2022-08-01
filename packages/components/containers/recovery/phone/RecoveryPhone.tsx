import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { updatePhone } from '@proton/shared/lib/api/settings';
import { SETTINGS_STATUS, UserSettings } from '@proton/shared/lib/interfaces';

import { Icon, InputFieldTwo, PhoneInput, useFormErrors, useModalState } from '../../../components';
import { classnames } from '../../../helpers';
import { useEventManager, useNotifications } from '../../../hooks';
import AuthModal from '../../password/AuthModal';
import ConfirmRemovePhoneModal from './ConfirmRemovePhoneModal';
import VerifyRecoveryPhoneModal from './VerifyRecoveryPhoneModal';

interface Props {
    phone: UserSettings['Phone'];
    hasReset: boolean;
    defaultCountry?: string;
    className?: string;
}

const RecoveryPhone = ({ phone, hasReset, defaultCountry, className }: Props) => {
    const [input, setInput] = useState(phone.Value || '');
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { onFormSubmit } = useFormErrors();
    const [verifyRecoveryPhoneModal, setVerifyRecoveryPhoneModalOpen, renderVerifyRecoveryPhoneModal] = useModalState();
    const [confirmModal, setConfirmModal, renderConfirmModal] = useModalState();
    const [authModal, setAuthModal, renderAuthModal] = useModalState();

    const confirmStep = !input && hasReset;
    const loading = renderConfirmModal || renderAuthModal || renderVerifyRecoveryPhoneModal;

    return (
        <>
            {renderConfirmModal && (
                <ConfirmRemovePhoneModal
                    {...confirmModal}
                    onConfirm={() => {
                        setAuthModal(true);
                    }}
                />
            )}
            {renderAuthModal && (
                <AuthModal
                    {...authModal}
                    onCancel={undefined}
                    onSuccess={async () => {
                        await call();
                        createNotification({ text: c('Success').t`Phone number updated` });
                    }}
                    config={updatePhone({ Phone: input })}
                />
            )}
            {renderVerifyRecoveryPhoneModal && <VerifyRecoveryPhoneModal phone={phone} {...verifyRecoveryPhoneModal} />}
            <form
                className={classnames(['flex flex-wrap on-mobile-flex-column', className])}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!onFormSubmit()) {
                        return;
                    }
                    if (confirmStep) {
                        setConfirmModal(true);
                    } else {
                        setAuthModal(true);
                    }
                }}
            >
                <div className="mr1 mb1 on-mobile-mr0 flex-item-fluid min-w14e">
                    <InputFieldTwo
                        as={PhoneInput}
                        id="phoneInput"
                        disableChange={loading}
                        defaultCountry={defaultCountry}
                        value={input}
                        onChange={setInput}
                        aria-label={c('label').t`Recovery phone number`}
                        assistiveText={
                            phone.Value &&
                            (phone.Status === SETTINGS_STATUS.UNVERIFIED ? (
                                <>
                                    <Icon
                                        className="color-danger flex-item-noshrink aligntop mr0-25"
                                        name="exclamation-circle-filled"
                                    />
                                    <span className="color-norm mr0-5">{c('Recovery Phone')
                                        .t`Phone number not yet verified.`}</span>
                                    <button
                                        className="link"
                                        type="button"
                                        onClick={() => setVerifyRecoveryPhoneModalOpen(true)}
                                    >
                                        {c('Recovery Phone').t`Verify now`}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Icon
                                        className="color-success flex-item-noshrink aligntop mr0-25"
                                        name="checkmark-circle-filled"
                                    />
                                    <span className="mr0-5">{c('Recovery Phone')
                                        .t`Phone number has been verified.`}</span>
                                </>
                            ))
                        }
                    />
                </div>
                <div className="mb0-5">
                    <Button
                        shape="outline"
                        type="submit"
                        disabled={(phone.Value || '') === input}
                        loading={loading}
                        data-testid="account:recovery:phoneSubmit"
                    >
                        {c('Action').t`Save`}
                    </Button>
                </div>
            </form>
        </>
    );
};

export default RecoveryPhone;
