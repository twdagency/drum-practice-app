/**
 * Component tests for ToolbarButton
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolbarButton } from '../ToolbarButton';

describe('ToolbarButton', () => {
  it('should render button with children', () => {
    render(<ToolbarButton>Click Me</ToolbarButton>);
    
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should render button with icon', () => {
    render(<ToolbarButton icon="fas fa-play">Play</ToolbarButton>);
    
    const icon = document.querySelector('.fas.fa-play');
    expect(icon).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<ToolbarButton onClick={handleClick}>Click Me</ToolbarButton>);
    
    const button = screen.getByText('Click Me');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<ToolbarButton disabled>Disabled Button</ToolbarButton>);
    
    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(
      <ToolbarButton onClick={handleClick} disabled>
        Disabled Button
      </ToolbarButton>
    );
    
    const button = screen.getByText('Disabled Button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply title attribute', () => {
    render(<ToolbarButton title="Tooltip text">Button</ToolbarButton>);
    
    const button = screen.getByTitle('Tooltip text');
    expect(button).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(
      <ToolbarButton variant="primary">Primary</ToolbarButton>
    );
    
    let button = screen.getByText('Primary');
    expect(button.className).toContain('dpgen-toolbar__button--primary');
    
    rerender(<ToolbarButton variant="small">Small</ToolbarButton>);
    button = screen.getByText('Small');
    expect(button.className).toContain('dpgen-toolbar__button--small');
  });

  it('should call onKeyDown when key is pressed', async () => {
    const user = userEvent.setup();
    const handleKeyDown = vi.fn();
    
    render(
      <ToolbarButton onKeyDown={handleKeyDown}>Button</ToolbarButton>
    );
    
    const button = screen.getByText('Button');
    button.focus();
    await user.keyboard('{Enter}');
    
    expect(handleKeyDown).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(
      <ToolbarButton className="custom-class">Button</ToolbarButton>
    );
    
    const button = screen.getByText('Button');
    expect(button.className).toContain('custom-class');
  });
});

