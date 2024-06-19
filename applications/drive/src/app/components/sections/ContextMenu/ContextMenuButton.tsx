import { PropsWithChildren } from 'react';

import { DropdownMenuButton, Icon, IconName } from '@proton/components';

interface Props {
    name: string;
    icon: IconName;
    testId: string;
    action: () => void;
    close: () => void;
}

const ContextMenuButton = ({ name, icon, testId, action, close, children }: PropsWithChildren<Props>) => {
    return (
        <DropdownMenuButton
            key={name}
            onContextMenu={(e) => e.stopPropagation()}
            className="flex items-center justify-space-between flex-nowrap"
            onClick={(e) => {
                e.stopPropagation();
                action();
                close();
            }}
            data-testid={testId}
        >
            <div className="flex items-center flex-nowrap text-left shrink-0">
                <Icon className="mr-2 shrink-0" name={icon} />
                {name}
            </div>
            {children}
        </DropdownMenuButton>
    );
};

export default ContextMenuButton;
