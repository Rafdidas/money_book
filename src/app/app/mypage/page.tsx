"use client";

import { useEffect, useState } from "react";

import AppIcon from "@/components/common/AppIcon";
import SideMenu from "@/components/common/SideMenu";
import ConsentCard from "@/components/mypage/ConsentCard";
import ProfileCard from "@/components/mypage/ProfileCard";
import { useAppData } from "@/app/providers";
import { getAccountOverview, type AccountOverview } from "@/lib/api/account";
import "./mypage.scss";

export default function MyPage() {
  const { displayName, displayEmail, isDemoMode, isAuthResolved } = useAppData();
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState(displayName);

  useEffect(() => {
    if (!isAuthResolved || isDemoMode) {
      return;
    }

    let isCancelled = false;

    const load = async () => {
      try {
        const loaded = await getAccountOverview();

        if (isCancelled) return;

        setOverview(loaded);
        setName(loaded.name);
      } catch {
        if (isCancelled) return;

        setLoadError("계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [isAuthResolved, isDemoMode]);

  if (!isAuthResolved) return null;

  return (
    <div className="home-page">
      <SideMenu displayName={name} displayEmail={displayEmail} isDemoMode={isDemoMode} />
      <main className="main mypage-page column-group">
        <section className="main-header mypage-header row-group row-group--center row-group--between">
          <div>
            <h2 className="main-header--title headline--sm">마이페이지</h2>
            <p className="mypage-header--description label--md">
              계정 정보와 보안 설정을 관리합니다.
            </p>
          </div>
        </section>

        {isDemoMode ? (
          <section className="card mypage-demo">
            <AppIcon name="account_circle" />
            <h3 className="title--sm">마이페이지는 로그인 후 이용할 수 있습니다.</h3>
            <p className="body--sm color-gray">
              데모 모드에는 실제 계정이 없어 정보를 확인하거나 변경할 수 없습니다.
            </p>
          </section>
        ) : (
          <div className="mypage-layout column-group column-group--gap-16">
            {loadError ? (
              <p className="caption--md mypage-error" role="alert">
                {loadError}
              </p>
            ) : null}
            {overview ? (
              <>
                <ProfileCard overview={overview} onNameSaved={setName} />
                <ConsentCard overview={overview} />
              </>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
