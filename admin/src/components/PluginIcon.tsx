import { SVGProps } from 'react';
import { DefaultTheme, useTheme } from 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      [key: string]: string;
    };
  }
}

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'fill' | 'stroke'> {
  /**
   * @default "currentColor"
   */
  fill?: keyof DefaultTheme['colors'] | (string & {});
  stroke?: keyof DefaultTheme['colors'] | (string & {});
}

const PluginIcon = ({
  fill: fillProp = 'currentColor',
  stroke: strokeProp,
  ...props
}: IconProps) => {
  const { colors } = useTheme();
  const fill = String(
    fillProp && fillProp in colors ? colors[fillProp as keyof DefaultTheme['colors']] : fillProp
  );

  const stroke =
    strokeProp && strokeProp in colors
      ? String(colors[strokeProp as keyof DefaultTheme['colors']])
      : strokeProp
        ? String(strokeProp)
        : undefined;

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill={fill}
      stroke={stroke}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M28.414 9.171L22.829 3.585C22.6433 3.3992 22.4228 3.25181 22.1801 3.15125C21.9373 3.05069 21.6772 2.99893 21.4145 2.99893C21.1518 2.99893 20.8917 3.05069 20.6489 3.15125C20.4062 3.25181 20.1857 3.3992 20 3.585L4.586 19C4.39938 19.185 4.25145 19.4053 4.15084 19.6481C4.05023 19.8909 3.99896 20.1512 4 20.414V26C4 26.5304 4.21071 27.0391 4.58579 27.4142C4.96086 27.7893 5.46957 28 6 28H11.586C11.8488 28.001 12.1091 27.9498 12.3519 27.8492C12.5947 27.7486 12.815 27.6006 13 27.414L28.414 12C28.5998 11.8143 28.7472 11.5938 28.8478 11.3511C28.9483 11.1084 29.0001 10.8482 29.0001 10.5855C29.0001 10.3228 28.9483 10.0627 28.8478 9.81995C28.7472 9.57725 28.5998 9.35673 28.414 9.171ZM24 13.585L18.414 8L21.414 5L27 10.585L24 13.585Z"
        fill="currentColor"
      />
      <path
        d="M4 12H2C1.73478 12 1.48043 11.8946 1.29289 11.7071C1.10536 11.5196 1 11.2652 1 11C1 10.7348 1.10536 10.4804 1.29289 10.2929C1.48043 10.1054 1.73478 10 2 10H4V8C4 7.73478 4.10536 7.48043 4.29289 7.29289C4.48043 7.10536 4.73478 7 5 7C5.26522 7 5.51957 7.10536 5.70711 7.29289C5.89464 7.48043 6 7.73478 6 8V10H8C8.26522 10 8.51957 10.1054 8.70711 10.2929C8.89464 10.4804 9 10.7348 9 11C9 11.2652 8.89464 11.5196 8.70711 11.7071C8.51957 11.8946 8.26522 12 8 12H6V14C6 14.2652 5.89464 14.5196 5.70711 14.7071C5.51957 14.8946 5.26522 15 5 15C4.73478 15 4.48043 14.8946 4.29289 14.7071C4.10536 14.5196 4 14.2652 4 14V12Z"
        fill="currentColor"
      />
      <path
        d="M9 2H10C10.2652 2 10.5196 2.10536 10.7071 2.29289C10.8946 2.48043 11 2.73478 11 3C11 3.26522 10.8946 3.51957 10.7071 3.70711C10.5196 3.89464 10.2652 4 10 4H9V5C9 5.26522 8.89464 5.51957 8.70711 5.70711C8.51957 5.89464 8.26522 6 8 6C7.73478 6 7.48043 5.89464 7.29289 5.70711C7.10536 5.51957 7 5.26522 7 5V4H6C5.73478 4 5.48043 3.89464 5.29289 3.70711C5.10536 3.51957 5 3.26522 5 3C5 2.73478 5.10536 2.48043 5.29289 2.29289C5.48043 2.10536 5.73478 2 6 2H7V1C7 0.734784 7.10536 0.48043 7.29289 0.292893C7.48043 0.105357 7.73478 0 8 0C8.26522 0 8.51957 0.105357 8.70711 0.292893C8.89464 0.48043 9 0.734784 9 1V2Z"
        fill="currentColor"
      />
    </svg>
  );
};

export { PluginIcon };
