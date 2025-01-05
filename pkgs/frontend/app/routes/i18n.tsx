import { Button } from "@chakra-ui/react";
import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import i18nServer from "~/config/i18n.server";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data?.title }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await i18nServer.getFixedT(request);
  return json({ title: t("title") });
}

/**
 * i18nの機能を試すためのサンプルコンポーネント
 * @returns
 */
export default function I18n() {
  const { t } = useTranslation();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>{t("title")}</h1>

      <Form>
        <Button type="submit" name="lng" value="en">
          English
        </Button>
        <Button type="submit" name="lng" value="ja">
          日本語
        </Button>
      </Form>
    </div>
  );
}