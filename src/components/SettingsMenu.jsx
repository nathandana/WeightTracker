import { useState, useRef } from 'react';
import {
  IconButton, Menu, MenuSection, MenuItem,
  RadioGroup, Dialog, Button, ButtonContainer, Paragraph,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';

const menuContentStyle = {
  padding: '12px 16px',
};

export function SettingsMenu({ locale, setLocale, onReset }) {
  const l = useLabel;
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const btnRef = useRef(null);

  function handleReset() {
    setResetOpen(false);
    onReset();
  }

  return (
    <>
      <div ref={btnRef} className="a1-top-header__action">
        <IconButton
          icon="settings"
          label={l('settings.label', 'Settings')}
          onClick={() => setOpen(prev => !prev)}
        />
      </div>

      <Menu
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={btnRef}
        aria-label={l('settings.label', 'Settings')}
      >
        <MenuSection label={l('settings.language', 'Language')}>
          <div style={menuContentStyle}>
            <RadioGroup
              options={[
                { value: 'en', label: l('profile.langEn', 'English') },
                { value: 'es', label: l('profile.langEs', 'Español') },
              ]}
              value={locale}
              onChange={(v) => { setLocale(v); setOpen(false); }}
            />
          </div>
        </MenuSection>
        <MenuSection>
          <MenuItem
            icon="delete_forever"
            variant="destructive"
            onClick={() => { setOpen(false); setResetOpen(true); }}
          >
            {l('profile.resetData', 'Reset All Data')}
          </MenuItem>
        </MenuSection>
      </Menu>

      <Dialog
        title={l('settings.resetTitle', 'Reset All Data')}
        status="error"
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        footer={
          <ButtonContainer align="end">
            <Button variant="destructive" onClick={handleReset}>
              {l('settings.resetConfirm', 'Yes, Reset Everything')}
            </Button>
            <Button variant="tertiary" onClick={() => setResetOpen(false)}>
              {l('common.cancel', 'Cancel')}
            </Button>
          </ButtonContainer>
        }
      >
        <Paragraph>
          {l('settings.resetBody', 'This will permanently delete all your weight data and profile information. This cannot be undone.')}
        </Paragraph>
      </Dialog>
    </>
  );
}
