import React, { useEffect, useRef, useCallback } from 'react';

const StarsBackground = ({ children, speed = 50, starColor = '#fff', factor = 0.05, ...props }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let stars = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create three layers of stars
    const createStars = () => {
      stars = [];
      
      // Layer 1: Small fast stars
      for (let i = 0; i < 300; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.3,
          layer: 1,
          speed: 1
        });
      }
      
      // Layer 2: Medium stars
      for (let i = 0; i < 150; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          dx: (Math.random() - 0.5) * 0.2,
          dy: (Math.random() - 0.5) * 0.2,
          layer: 2,
          speed: 0.5
        });
      }
      
      // Layer 3: Large slow stars
      for (let i = 0; i < 75; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2 + 1.5,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          dx: (Math.random() - 0.5) * 0.1,
          dy: (Math.random() - 0.5) * 0.1,
          layer: 3,
          speed: 0.3
        });
      }
    };

    createStars();

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const mouseInfluence = {
        x: (mouseRef.current.x - width / 2) * factor,
        y: (mouseRef.current.y - height / 2) * factor
      };

      stars.forEach((star) => {
        // Update position with parallax effect
        star.x += star.dx + (mouseInfluence.x * star.speed * 0.01);
        star.y += star.dy + (mouseInfluence.y * star.speed * 0.01);

        // Wrap around edges
        if (star.x < -10) star.x = width + 10;
        if (star.x > width + 10) star.x = -10;
        if (star.y < -10) star.y = height + 10;
        if (star.y > height + 10) star.y = -10;

        // Twinkle effect
        star.opacity += Math.sin(Date.now() * star.twinkleSpeed) * 0.01;
        star.opacity = Math.max(0.1, Math.min(1, star.opacity));

        // Draw star
        ctx.save();
        ctx.globalAlpha = star.opacity;
        ctx.fillStyle = starColor;
        ctx.shadowBlur = star.radius * 3;
        ctx.shadowColor = starColor;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add sparkle effect for larger stars
        if (star.radius > 2) {
          ctx.strokeStyle = starColor;
          ctx.globalAlpha = star.opacity * 0.3;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(star.x - star.radius * 2, star.y);
          ctx.lineTo(star.x + star.radius * 2, star.y);
          ctx.moveTo(star.x, star.y - star.radius * 2);
          ctx.lineTo(star.x, star.y + star.radius * 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [starColor, factor, speed]);

  const handleMouseMove = useCallback((e) => {
    mouseRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  }, []);

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at bottom, #262626 0%, #000 100%)',
        ...props.style
      }}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default StarsBackground;
