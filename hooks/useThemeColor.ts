/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */
import type { ColorScheme } from "../theme/colors";
import { useColorScheme } from "./useColorScheme";

type ColorKey = keyof ColorScheme;

export function useThemeColor(
    props: { light?: ColorKey; dark?: ColorKey },
    colorName: ColorKey,
) {
    const { isDark, colors } = useColorScheme();
    const colorFromProps = props[isDark ? "dark" : "light"];

    if (colorFromProps) {
        return colors[colorFromProps];
    }
    return colors[colorName];
}
