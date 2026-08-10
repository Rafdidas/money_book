"use client";

import AppIcon from "@/components/common/AppIcon";
import SideMenu from "@/components/common/SideMenu";
import { useAppData } from "@/app/providers";
import "./mypage.scss";

export default function MyPage() {
  const { displayName, displayEmail, isDemoMode } = useAppData();

  return (
    <div className="home-page">
      <SideMenu
        displayName={displayName}
        displayEmail={displayEmail}
        isDemoMode={isDemoMode}
      />
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
          <div className="mypage-layout column-group column-group--gap-16" />
        )}
      </main>
    </div>
  );
}
