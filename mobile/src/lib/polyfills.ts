// Must be imported before anything that touches @aws-sdk — the AWS SDK's
// crypto operations need these and React Native doesn't provide them
// natively. Imported first in src/app/_layout.tsx.
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
