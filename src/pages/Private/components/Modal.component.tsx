import { FC } from 'react';

// Material UI
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider
} from '@mui/material/';

interface IContentModal {
  title: string;
  text: string;
  clickConfirm: () => void;
}

interface Props {
  open: boolean;
  handleClose: () => void;
  children: JSX.Element;
  content: IContentModal;
}

export const Modal: FC<Props> = ({ open, handleClose, children, content }) => {
  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            border: 1,
            borderColor: 'divider',
            boxShadow:
              '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
            p: 0.5
          }
        }}
      >
        <DialogTitle
          id='alert-dialog-title'
          sx={{ fontWeight: 700, color: 'text.primary', pb: 1.5 }}
        >
          {content.title}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2 }}>
          <DialogContentText
            id='alert-dialog-description'
            sx={{ color: 'text.secondary', fontSize: '0.9375rem' }}
          >
            {content.text}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button
            onClick={handleClose}
            variant='outlined'
            sx={{
              borderRadius: 1.75,
              borderColor: 'divider',
              color: 'text.secondary'
            }}
          >
            Cancelar
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={content.clickConfirm}
            sx={{ borderRadius: 1.75 }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
