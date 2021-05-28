import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Local outgoing message text', () => {
  render(<App />);
  const localMessageElement = screen.getByText(/Local outgoing message/i);
  expect(localMessageElement).toBeInTheDocument();
});
